import WhatsAppInstance from '../class/instance'
import getDatabaseService from '../service/database'
import { AppType } from '../helper/types'
import { getInstanceService } from '../service/instance'
import getLogger from '../../config/logging'

const logger = getLogger('session')

class Session {
    app: AppType

    constructor (app: AppType) {
        this.app = app
    }

    async restoreSessions () {
        const restoredSessions: string[] = []
        try {
            const db = getDatabaseService(this.app)
            const table = db.table<WhatsAppInstance['config']>('session')
            const result = await table.find({})
            for (const config of result ?? []) {
                try {
                    const instance = new WhatsAppInstance(this.app, config)
                    await instance.init()
                    restoredSessions.push(config.key)
                } catch (e) {
                    logger.error(e, `Error restoring session ${config.key}`)
                }
            }
        } catch (e) {
            logger.error(e, 'Error restoring sessions')
        }
        return restoredSessions
    }

    async readSessions () {
        const instances: string[] = []
        const db = getDatabaseService(this.app)
        const table = db.table<WhatsAppInstance['config']>('session')
        const result = await table.find({})
        result?.forEach((instance) => {
            instances.push(instance.key)
        })
        return instances
    }

    async saveSession (session: WhatsAppInstance) {
        const db = getDatabaseService(this.app)
        const table = db.table<WhatsAppInstance['config']>('session')
        await table.replaceOne(session.config, session.config)
    }
}

export default Session
