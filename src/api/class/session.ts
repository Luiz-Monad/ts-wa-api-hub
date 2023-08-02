/* eslint-disable no-unsafe-optional-chaining */
import WhatsAppInstance from '../class/instance'
import pino from 'pino'
import config from '../../config/config'
import getDatabaseService from '../service/database'
import { AppType } from '../helper/types'
import { getInstanceService } from '../service/instance'

const logger = pino()

class Session {
    app: AppType

    constructor(app: AppType){
        this.app = app
    }

    async restoreSessions() {
        let restoredSessions : string[] = []
        let allCollections : string[] = []
        try {
            const instances = getInstanceService(this.app).instances
            const db = getDatabaseService(this.app)
            const result = await db.listCollections().toArray()
            result.forEach((collection) => {
                allCollections.push(collection.name)
            })

            for await (const key of allCollections) {
                const query = {}
                const _ = await db.collection(key).find(query)
                const webhook = !config.webhookEnabled
                    ? false
                    : config.webhookEnabled
                const webhookUrl = !config.webhookUrl
                    ? null
                    : config.webhookUrl
                const instance = new WhatsAppInstance(
                    this.app,
                    key,
                    webhook,
                    webhookUrl
                )
                await instance.init()
                instances[key] = instance
                restoredSessions.push(key)
            }
        } catch (e) {
            logger.error('Error restoring sessions')
            logger.error(e)
        }
        return restoredSessions
    }
}

export default Session
