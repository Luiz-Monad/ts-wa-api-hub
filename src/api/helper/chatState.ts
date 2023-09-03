import { proto } from '@whiskeysockets/baileys'
import getLogger from '../../config/logging'
import ChatType from '../models/chat.model'
import getDatabaseService from '../service/database'
import { AppType, TypeOfPromise } from './types'
import { Chat } from '@whiskeysockets/baileys/lib/Types/Chat'
import { BaileysEventMap } from '@whiskeysockets/baileys/lib/Types/Events'
import { v4 as uuidv4 } from 'uuid'

const logger = getLogger('chat')

export default async function useChatState(app: AppType, key: string) {
    const db = getDatabaseService(app)
    const chatTable = db.table<ChatType>(`${key}-chat`)
    const fixKey = (key: Partial<proto.IMessageKey>, _id: string) => ({
        ...key,
        id: _id,
    })
    const fixMessage = (message: Partial<proto.IMessage>, _id: string) => ({
        ...message,
    })
    const fixMessageInfo = (message: Partial<proto.IWebMessageInfo>, _id: string) => ({
        ...message,
        _id: _id,
        key: fixKey(message.key ?? {}, _id),
        message: fixMessage(message.message ?? {}, _id),
    })
    const fixChatId = (chat: Partial<Chat>, _chatId: string) => ({
        ...chat,
        _id: _chatId,
        id: _chatId,
        messages: (chat.messages ?? []).map((h) => ({
            ...h,
            message: fixMessageInfo(h.message ?? {}, h?.message?.key?.id ?? uuidv4()),
        })),
    })
    const fixChat = (chat: Partial<Chat>) => fixChatId(chat, chat.id ?? uuidv4())
    return {
        setChats: async (event: BaileysEventMap['messaging-history.set']) => {
            const tasks = []
            for (const chat of event.chats) {
                const data = fixChat(chat)
                tasks.push(chatTable.replaceOne(data, data, { upsert: true }))
            }
            await Promise.all(tasks)
        },
        upsertChats: async (chats: BaileysEventMap['chats.upsert']) => {
            const tasks = []
            for (const chat of chats) {
                const data = fixChat(chat)
                tasks.push(chatTable.replaceOne(data, data, { upsert: true }))
            }
            await Promise.all(tasks)
        },
        updateChats: async (chats: BaileysEventMap['chats.update']) => {
            const tasks = []
            for (const chat of chats) {
                const data = fixChat(chat)
                tasks.push(chatTable.updateOne(data, data, { upsert: true }))
            }
            await Promise.all(tasks)
        },
        deleteChats: async (ids: BaileysEventMap['chats.delete']) => {
            const tasks = []
            for (const id of ids) {
                const data = { _deleted: true }
                tasks.push(chatTable.updateOne({ _id: id }, data))
            }
            await Promise.all(tasks)
        },
        archiveChats: async () => {
            // just leave it there for now
        },
    }
}

export type ChatState = TypeOfPromise<ReturnType<typeof useChatState>>
