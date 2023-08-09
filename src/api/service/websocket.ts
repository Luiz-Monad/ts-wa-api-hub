import { AppType, ServerType } from '../helper/types'
import { Server } from 'socket.io'
import config from '../../config/config'
import getLogger from '../../config/logging'

const logger = getLogger('websocket')


export class WebSocket {
    appServer: ServerType
    allowCallback: boolean = false
    io: Server | null = null

    constructor(appServer: ServerType, allowCallback: boolean) {
        this.appServer = appServer
        this.allowCallback = allowCallback
    }

    async sendCallback(type: string, body: any, key: string) {
        if (!this.allowCallback) return
        if (!this.io) {
            this.io = new Server(this.appServer)
        }
        this.io.emit(type, {
            ...body,
            instanceKey: key,
        })
    }

    enable() {
        return new WebSocket(this.appServer, true)
    }
}

export async function initWebSocketService(app: AppType, server: ServerType) {
    const allow = config.websocketEnabled
    app.set('WebSocketService', new WebSocket(server, allow))
    if (allow) logger.info('Using WebSocket service')
}

export default function getWebSocketService(app: AppType): WebSocket {
    const WebSocketService: WebSocket = app.get('WebSocketService')
    return WebSocketService
}
