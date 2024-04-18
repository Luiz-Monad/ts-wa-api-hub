import WhatsAppSession from '../class/session'
import { AppType } from '../helper/types'
import config from '../../config/config'
import getLogger from '../../config/logging'

const logger = getLogger('session')

export async function initSessionService (app: AppType) {
    const instance = new WhatsAppSession(app)
    app.set('SessionService', instance)
    if (!config.instance.restoreSessionsOnStartup) return
    logger.info('Restoring Sessions')
    const sessions = await instance.restoreSessions()
    logger.info(`${sessions.length} Session(s) Restored`)
}

export function getSessionService (app: AppType): WhatsAppSession {
    const SessionService: WhatsAppSession = app.get('SessionService')
    return SessionService
}
