import { proto } from '@whiskeysockets/baileys/WAProto'
import { AuthenticationCreds, initAuthCreds } from '@whiskeysockets/baileys'
import { BufferJSON } from '@whiskeysockets/baileys/lib/Utils/generics'
import { AppType, TypeOfPromise } from './types'
import getDatabaseService from '../service/database'
import getLogger from '../../config/logging'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SignalKeyStoreType = any

const logger = getLogger('auth')

export default async function useAuthState (app: AppType, key: string) {
    const db = getDatabaseService(app)
    const table = db.table(`${key}-auth`)
    const writeData = async (data: unknown, id: string) => {
        try {
            return await table.replaceOne(
                { _id: id },
                JSON.parse(JSON.stringify(data, BufferJSON.replacer)),
                { upsert: true }
            )
        } catch (error) {
            logger.error(error)
            throw error
        }
    }
    const readData = async <T>(id: string) => {
        try {
            const data = await table.findOne({ _id: id })
            if (!data) return null
            return JSON.parse(JSON.stringify(data), BufferJSON.reviver) as T
        } catch (error) {
            logger.warn(error)
            return null
        }
    }
    const removeData = async (id: string) => {
        try {
            await table.deleteOne({ _id: id })
        } catch (error) {
            logger.warn(error)
        }
    }
    const dropBobbyTable = async () => {
        try {
            await table.drop()
        } catch (error) {
            logger.error(error)
            throw error
        }
    }
    const readCreds = async () =>
        (await readData<AuthenticationCreds>('creds')) || initAuthCreds()
    return {
        readState: async () => ({
            creds: await readCreds(),
            keys: {
                get: async (type: string, ids: string[]) => {
                    const data: Record<string, SignalKeyStoreType> = {}
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`)
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(data)
                            }
                            data[id] = value
                        })
                    )
                    return data
                },
                set: async (data: Record<string, SignalKeyStoreType>) => {
                    const tasks = []
                    for (const category of Object.keys(data)) {
                        for (const id of Object.keys(data[category])) {
                            const value = data[category][id]
                            const key = `${category}-${id}`
                            tasks.push(value ? writeData(value, key) : removeData(key))
                        }
                    }
                    await Promise.all(tasks)
                },
            },
        }),
        saveState: async (creds: Partial<AuthenticationCreds>) => {
            const prevCreds = await readCreds()
            const newCreds = { ...prevCreds, ...creds }
            return await writeData(newCreds, 'creds')
        },
        dropState: async () => {
            return await dropBobbyTable()
        },
    }
}

export type AuthState = TypeOfPromise<ReturnType<typeof useAuthState>>
