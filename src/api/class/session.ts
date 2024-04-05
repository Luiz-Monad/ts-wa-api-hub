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
            const service = getInstanceService(this.app)
            const db = getDatabaseService(this.app)
            const sessions = await this.readSessions()
            for (const key of sessions) {
                try {
                    const query = {}
                    const _ = await db.table(key).find(query)
                    const instance = new WhatsAppInstance(
                        this.app,
                        key,
                        /*allowCallback*/ true
                    )
                    await instance.init()
                    service.register(instance)
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

    async readSessions () {
        const instances: string[] = []
        const db = getDatabaseService(this.app)
        const result = await db.listTable()
        result.forEach((table) => {
            instances.push(table.name)
        })
        return instances
    }
}

export default Session
