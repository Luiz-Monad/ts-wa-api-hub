import WhatsAppSession from '../class/session'
import { AppType } from '../helper/types'
import config from '../../config/config'
import pino from 'pino'

const logger = pino()

interface Session
{
    instance?: WhatsAppSession
}

export async function initSessionService(app: AppType) {
    const session: Session = {}
    if (config.instance.restoreSessionsOnStartup) {
        logger.info(`Restoring Sessions`)
        session.instance = new WhatsAppSession(app)
        const restoreSessions = await session.instance.restoreSessions()
        logger.info(`${restoreSessions.length} Session(s) Restored`)
    }
    app.set('SessionService', session)
}

export default function getSessionService(app: AppType): Session {
    const SessionService: Session = app.get('SessionService')
    return SessionService
}
