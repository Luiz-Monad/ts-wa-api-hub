import WhatsAppSession from '../class/session'
import { AppType } from '../helper/types'
import config from '../../config/config'
import getLogger from '../../config/logging'

const logger = getLogger('session')

interface Session {
    instance: WhatsAppSession
}

export async function initSessionService(app: AppType) {
    const instance = new WhatsAppSession(app)
    const session: Session = {
        instance: instance,
    }
    app.set('SessionService', session)
    if (!config.instance.restoreSessionsOnStartup) return
    logger.info('Restoring Sessions')
    const sessions = await instance.restoreSessions()
    logger.info(`${sessions.length} Session(s) Restored`)
}

export default function getSessionService(app: AppType): Session {
    const SessionService: Session = app.get('SessionService')
    return SessionService
}
