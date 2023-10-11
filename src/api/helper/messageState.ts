import { proto } from '@whiskeysockets/baileys'
import getLogger from '../../config/logging'
import MessageInfoType from '../models/message.model'
import getDatabaseService from '../service/database'
import { AppType, TypeOfPromise } from './types'
import { BaileysEventMap } from '@whiskeysockets/baileys/lib/Types/Events'
import { v4 as uuidv4 } from 'uuid'

const logger = getLogger('message')

export default async function useMessageState (app: AppType, key: string) {
    const db = getDatabaseService(app)
    const messageTable = db.table<MessageInfoType>(`${key}-message`)
    const fixKey = (
        key: Partial<proto.IMessageKey>,
        altKey: Partial<proto.IMessageKey>,
        _id: string
    ) => ({
        ...altKey,
        ...key,
        id: _id,
    })
    const fixMessage = (message: Partial<proto.IMessage>, _id: string) => ({
        ...message,
    })
    const fixMessageInfoId = (
        message: Partial<proto.IWebMessageInfo>,
        key: Partial<proto.IMessageKey>,
        _id: string
    ) => ({
        ...message,
        _id: _id,
        key: fixKey(key, message.key ?? {}, _id),
        message: fixMessage(message.message ?? {}, _id),
    })
    const fixMessageInfo = (
        info: Partial<proto.IWebMessageInfo>,
        key: Partial<proto.IMessageKey>
    ) => fixMessageInfoId(info, key, key.id ?? info.key?.id ?? uuidv4())
    return {
        setMessages: async (event: BaileysEventMap['messaging-history.set']) => {
            const tasks = []
            for (const message of event.messages) {
                const data = fixMessageInfo(message, message.key)
                tasks.push(messageTable.replaceOne(data, data, { upsert: true }))
            }
            await Promise.all(tasks)
        },
        upsertMessages: async (event: BaileysEventMap['messages.upsert']) => {
            const tasks = []
            for (const message of event.messages) {
                if (event.type !== 'append') continue
                const data = fixMessageInfo(message, message.key)
                tasks.push(messageTable.replaceOne(data, data, { upsert: true }))
            }
            await Promise.all(tasks)
        },
        updateMessages: async (events: BaileysEventMap['messages.update']) => {
            const tasks = []
            for (const event of events) {
                const data = fixMessageInfo(event.update, event.key)
                tasks.push(messageTable.updateOne(data, data, { upsert: true }))
            }
            await Promise.all(tasks)
        },
        deleteMessages: async (ids: BaileysEventMap['messages.delete']) => {
            const tasks = []
            if ('keys' in ids) {
                for (const key of ids.keys) {
                    if (!key.id) continue
                    const data = { _deleted: true }
                    tasks.push(messageTable.updateOne({ _id: key.id }, data))
                }
            } else {
                // delete all messages of a user
            }
            await Promise.all(tasks)
        },
        archiveMessages: async () => {
            // just leave it there for now
        },
    }
}

export type MessageState = TypeOfPromise<ReturnType<typeof useMessageState>>
