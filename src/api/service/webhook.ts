import { AppType, ServerType } from '../helper/types'
import axios, { AxiosInstance } from 'axios'
import config from '../../config/config'
import pino from 'pino'

const logger = pino()

export class WebHook {
    webHookUrl: string | null
    allowCallback: boolean
    axiosInstance: AxiosInstance | null = null

    constructor(webHookUrl: string | null, allowCallback: boolean) {
        this.webHookUrl = webHookUrl
        this.allowCallback = allowCallback
    }

    async sendCallback(type: string, body: any, key: string) {
        if (!this.allowCallback) return
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
            return new WebHook(customWebhook, true)
        }
        return new WebHook(this.webHookUrl, true)
    }
}

export async function initWebHookService(app: AppType, server: ServerType) {
    const allow = config.webhookEnabled
    const webhookUrl = config.webhookUrl ?? null
    app.set('WebHookService', new WebHook(webhookUrl, allow))
    if (allow) logger.info(`Using WebHooks service at ${webhookUrl}`)
}

export default function getWebHookService(app: AppType): WebHook {
    const WebHookService: WebHook = app.get('WebHookService')
    return WebHookService
}
