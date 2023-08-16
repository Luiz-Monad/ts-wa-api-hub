import WhatsAppInstance from '../class/instance'
import getDatabaseService from '../service/database'
import { AppType } from '../helper/types'
import { getInstanceService } from '../service/instance'
import getLogger from '../../config/logging'

const logger = getLogger('session')

class Session {
    app: AppType

    constructor(app: AppType) {
        this.app = app
    }

    async restoreSessions() {
        let restoredSessions: string[] = []
        let allCollections: string[] = []
        try {
            const instances = getInstanceService(this.app).instances
            const db = getDatabaseService(this.app)
            const result = await db.listTable()
            result.forEach((collection) => {
                allCollections.push(collection.name)
            })

            for await (const key of allCollections) {
                try {
                    const query = {}
                    const _ = await db.table(key).find(query)
                    const instance = new WhatsAppInstance(this.app, key)
                    await instance.init()
                    instances[key] = instance
                    restoredSessions.push(key)
                } catch (e) {
                    logger.error(e, `Error restoring session ${key}`)
                }
            }
        } catch (e) {
            logger.error(e, 'Error restoring sessions')
        }
        return restoredSessions
    }
}

export default Session
