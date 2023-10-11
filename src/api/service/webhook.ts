import { AppType, ServerType } from '../helper/types'
import axios, { AxiosInstance } from 'axios'
import config from '../../config/config'
import getLogger from '../../config/logging'
import { Callback } from '../class/callback'
import getCallbackService from './callback'

const logger = getLogger('webhook')

export class WebHook extends Callback {
    axiosInstance: AxiosInstance | null = null

    constructor (address: string | null, enabled: boolean, filters: string | null) {
        super('WebHook', enabled, address, filters)
    }

    async coreSendCallback (type: string, body: any, key: string) {
        if (!this.axiosInstance && this.address) {
            this.axiosInstance = axios.create({
                baseURL: this.address,
            })
        }
        this.axiosInstance
            ?.post('', {
                type,
                body,
                instanceKey: key,
            })
            .catch(() => {})
    }

    coreEnable (address: string | null): Callback {
        return new WebHook(address, true, this.filters)
    }
}

export async function initWebHookService (app: AppType, server: ServerType) {
    const enabled = config.webhookEnabled
    const webhookUrl = config.webhookUrl ?? null
    const filters = config.webhookAllowedEvents ?? null
    const webhook = new WebHook(webhookUrl, enabled, filters)
    app.set('WebHookService', webhook)
    getCallbackService(app).register(webhook)
    if (enabled) logger.info(`Using WebHooks service at ${webhookUrl}`)
}

export default function getWebHookService (app: AppType): WebHook {
    const WebHookService: WebHook = app.get('WebHookService')
    return WebHookService
}
