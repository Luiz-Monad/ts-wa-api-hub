import { AppType, ServerType } from '../helper/types'
import { Server } from 'socket.io'
import config from '../../config/config'
import getLogger from '../../config/logging'
import { Callback } from '../class/callback'

const logger = getLogger('websocket')

export class WebSocket extends Callback {
    appServer: ServerType
    io: Server | null = null

    constructor(appServer: ServerType, enabled: boolean, filters: string | null) {
        super(enabled, filters)
        this.appServer = appServer
    }

    async coreSendCallback(type: string, body: any, key: string) {
        if (!this.io) {
            this.io = new Server(this.appServer)
        }
        this.io.emit(type, {
            ...body,
            instanceKey: key,
        })
    }

    enable() {
        return new WebSocket(this.appServer, true, this.filters)
    }
}

export async function initWebSocketService(app: AppType, server: ServerType) {
    const enabled = config.websocketEnabled
    const filters = config.webhookAllowedEvents ?? null
    app.set('WebSocketService', new WebSocket(server, enabled, filters))
    if (enabled) logger.info('Using WebSocket service')
}

export default function getWebSocketService(app: AppType): WebSocket {
    const WebSocketService: WebSocket = app.get('WebSocketService')
    return WebSocketService
}
