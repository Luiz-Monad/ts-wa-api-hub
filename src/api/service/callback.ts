import { AppType, ServerType } from '../helper/types'
import config from '../../config/config'
import getLogger from '../../config/logging'
import { CallBackType, Callback } from '../class/callback'

const logger = getLogger('callback')

export class MultiCallback extends Callback {
    callbacks: Callback[] = []

    constructor() {
        super('MultiCallback', true, '*', null)
    }

    async sendCallback(type: CallBackType, body: any, key: string) {
        for (const callback of this.callbacks) {
            callback.sendCallback(type, body, key)
        }
    }

    enable(address: string | null | undefined): Callback {
        for (const callback of this.callbacks) {
            callback.enable(address)
        }
        return this
    }

    register(callback: Callback) {
        this.callbacks.push(callback)
    }
}

export async function initCallbackService(app: AppType, server: ServerType) {
    app.set('CallbackService', new MultiCallback())
    logger.info(`Using MultiCallback service`)
}

export default function getCallbackService(app: AppType): MultiCallback {
    const CallbackService: MultiCallback = app.get('CallbackService')
    return CallbackService
}
