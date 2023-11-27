import { AppType, ServerType } from '../helper/types'
import { Server } from 'socket.io'
import config from '../../config/config'
import getLogger from '../../config/logging'
import { CallBackBody, Callback } from '../class/callback'
import getCallbackService from './callback'

const logger = getLogger('websocket')

export class WebSocket extends Callback {
    appServer: ServerType
    io: Server | null = null

    constructor (appServer: ServerType, enabled: boolean, filters: string | null) {
        super('WebSocket', enabled, '<ws>', filters)
        this.appServer = appServer
    }

    async coreSendCallback (type: string, body: CallBackBody, key: string) {
        if (!this.io) {
            this.io = new Server(this.appServer)
        }
        this.io.emit(type, {
            ...(typeof body === 'string' ? { value: body } : body),
            instanceKey: key,
        })
    }

    coreEnable (address: string | null): Callback {
        return new WebSocket(this.appServer, true, this.filters)
    }
}

export async function initWebSocketService (app: AppType, server: ServerType) {
    const enabled = config.websocketEnabled
    const filters = config.webhookAllowedEvents ?? null
    const websocket = new WebSocket(server, enabled, filters)
    app.set('WebSocketService', websocket)
    getCallbackService(app).register(websocket)
    if (enabled) logger.info('Using WebSocket service')
}

export default function getWebSocketService (app: AppType): WebSocket {
    const WebSocketService: WebSocket = app.get('WebSocketService')
    return WebSocketService
}
