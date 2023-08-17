import { GroupMetadata, GroupParticipant } from '@whiskeysockets/baileys'
import getLogger from '../../config/logging'
import ChatType, { ChatParticipantType } from '../models/chat.model'
import getDatabaseService from '../service/database'
import { AppType, TypeOfPromise } from './types'
import { BaileysEventMap } from '@whiskeysockets/baileys/lib/Types/Events'
import { v4 as uuidv4 } from 'uuid'

const logger = getLogger('group')

export default async function useGroupState(app: AppType, key: string) {
    const db = getDatabaseService(app)
    const groupChatTable = db.table<ChatType>(`${key}-group-chat`)
    const fixParticipant = (p: GroupParticipant) => ({ 
        userJid: p.id, 
        rank: p.admin === 'superadmin'
            ? ChatParticipantType.Rank.SUPERADMIN
            : p.admin === 'admin'
            ? ChatParticipantType.Rank.ADMIN
            : ChatParticipantType.Rank.REGULAR,
    })
    const fixChatId = (chat: Partial<GroupMetadata>, _chatId: string): ChatType => ({
        _id: _chatId,
        _group: chat,
        id: _chatId,
        name: chat.subject,
        participant: chat.participants?.map(fixParticipant),
        messages: [],
        createdAt: chat.creation,
        createdBy: chat.subjectOwner,
    })
    const fixChat = (chat: Partial<GroupMetadata>) => fixChatId(chat, chat.id ?? uuidv4())
    return {
        findGroupChat: async (id: string): Promise<ChatType | null> => {
            return await groupChatTable.findOne({ _id: id })
        },
        findGroupChats: async (): Promise<ChatType[] | null> => {
            return await groupChatTable.find({})
        },
        setGroupChats: async (participants: Record<string, GroupMetadata>) => {
            const task = async (group: GroupMetadata) => {
                const save = {
                    participant: group.participants.map(fixParticipant),
                    ...(group.creation ? { createdAt: group.creation } : {}),
                    ...(group.subjectOwner ? { createdBy: group.subjectOwner } : {})
                }
                await groupChatTable.updateOne({ _id: group.id }, save, { upsert: true })
            }            
            const tasks = []
            for (const value of Object.values(participants)) {
                tasks.push(task(value))
            }
            await Promise.all(tasks)
        },
        upsertGroupChats: async (groups: BaileysEventMap['groups.upsert']) => {
            const tasks = []
            for (const group of groups) {
                const data = fixChat(group)
                tasks.push(groupChatTable.replaceOne(data, data, { upsert: true }))
            }
            await Promise.all(tasks)
        },
        updateGroupChats: async (groups: BaileysEventMap['groups.update']) => {
            const tasks = []
            for (const group of groups) {
                const data = fixChat(group)
                tasks.push(groupChatTable.updateOne(data, data, { upsert: true }))
            }
            await Promise.all(tasks)
        },
        updateGroupParticipants: async (group: BaileysEventMap['group-participants.update']) => {
            let is_owner = false
            const chat = await groupChatTable.findOne({ _id: group.id })
            if (!chat) return
            const parts: Record<string, ChatParticipantType | null> = {}
            if (chat.participant) {
                for (const participant of chat.participant) {
                    parts[participant.userJid] = participant
                }
            }
            switch (group.action) {
                case 'add':
                    for (const participant of group.participants) {
                        parts[participant] = {
                            userJid: participant
                        }
                    }
                    break
                case 'remove':
                    for (const participant of group.participants) {
                        // remove group if they are owner
                        if (chat.createdBy === participant) {
                            is_owner = true
                        }
                        parts[participant] = null
                    }
                    break
                case 'demote':
                    for (const participant of group.participants) {
                        parts[participant] = {
                            userJid: participant,
                            rank: ChatParticipantType.Rank.REGULAR,
                        }
                    }
                    break
                case 'promote':
                    for (const participant of group.participants) {
                        parts[participant] = {
                            userJid: participant,
                            rank: ChatParticipantType.Rank.ADMIN,
                        }
                    }
                    break
            }
            if (is_owner) {                
                const data = { _deleted: true }
                await groupChatTable.updateOne({ _id: group.id }, data)
            } else {
                const save = {
                    participant: Object.values(parts).filter(p => !!p).map(p => p!),
                }
                await groupChatTable.updateOne({ _id: group.id }, save, { upsert: true })
            }
        },
        archiveGroupChats: async () => {
            // just leave it there for now
        },
    }
}

export type GroupState = TypeOfPromise<ReturnType<typeof useGroupState>>
