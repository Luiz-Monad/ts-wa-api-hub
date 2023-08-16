import { AppType, ServerType } from '../helper/types'
import axios, { AxiosInstance } from 'axios'
import config from '../../config/config'
import getLogger from '../../config/logging'
import { Callback } from '../class/callback'

const logger = getLogger('webhook')

export class WebHook extends Callback {
    webHookUrl: string | null
    axiosInstance: AxiosInstance | null = null

    constructor(webHookUrl: string | null, enabled: boolean, filters: string | null) {
        super(enabled, filters)
        this.webHookUrl = webHookUrl
    }

    async coreSendCallback(type: string, body: any, key: string) {
        if (!this.axiosInstance && this.webHookUrl) {
            this.axiosInstance = axios.create({
                baseURL: this.webHookUrl,
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

    enable(customWebhook?: string | null) {
        if (customWebhook) {
            return new WebHook(customWebhook, true, this.filters)
        }
        return new WebHook(this.webHookUrl, true, this.filters)
    }
}

export async function initWebHookService(app: AppType, server: ServerType) {
    const enabled = config.webhookEnabled
    const webhookUrl = config.webhookUrl ?? null
    const filters = config.webhookAllowedEvents ?? null
    app.set('WebHookService', new WebHook(webhookUrl, enabled, filters))
    if (enabled) logger.info(`Using WebHooks service at ${webhookUrl}`)
}

export default function getWebHookService(app: AppType): WebHook {
    const WebHookService: WebHook = app.get('WebHookService')
    return WebHookService
}
