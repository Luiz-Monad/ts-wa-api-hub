import pino from 'pino'
import pinoHttp from 'pino-http'
import prettyPrint from 'pino-pretty'
import stdSerializers from 'pino-std-serializers'
import { IncomingMessage, ServerResponse } from 'http'
import config from './config'

import type { Logger as WaLogger } from '@whiskeysockets/baileys/node_modules/pino'

const colorCodes = [
    30, // Black
    31, // Red
    32, // Green
    33, // Yellow
    34, // Blue
    35, // Magenta
    36, // Cyan
    37, // White
    90, // Bright Black
    91, // Bright Red
    92, // Bright Green
    93, // Bright Yellow
    94, // Bright Blue
    95, // Bright Magenta
    96, // Bright Cyan
    97, // Bright White
]

const loggerColors: Record<string, number> = {}
const usedColors: Record<number, boolean> = {}

function getRandomUnusedColor (): number {
    const unusedColors = colorCodes.filter((code) => !usedColors[code])
    if (unusedColors.length === 0) {
        // All colors have been used, just select a random color
        return colorCodes[Math.floor(Math.random() * colorCodes.length)]
    } else {
        const selected = unusedColors[Math.floor(Math.random() * unusedColors.length)]
        usedColors[selected] = true
        return selected
    }
}

function getColorForLogger (loggerName: string): number {
    if (!loggerColors[loggerName]) {
        loggerColors[loggerName] = getRandomUnusedColor()
    }
    return loggerColors[loggerName]
}

function getAnsiColor (code: number): string {
    return `\x1b[${code}m`
}

function colorizeText (code: number, text: string): string {
    return `${getAnsiColor(code)}${text}${getAnsiColor(0)}`
}

function colorizeMessage (message: string): string {
    return colorizeText(getColorForLogger(message), message)
}

function getStream () {
    return prettyPrint({
        ignore: 'pid,hostname,_req,_res',
        customPrettifiers: {
            name: (msg) => colorizeMessage(`${msg}`),
        },
    })
}

export function getHttpLogger () {
    if (config.log.httpLevel === 'silent') return null
    const colorStatus = (status: number) => {
        if (status >= 400 && status < 500) {
            return colorizeText(33, String(status))
        } else if (status >= 500) {
            return colorizeText(91, String(status))
        } else {
            return colorizeText(32, String(status))
        }
    }
    const isDebug = config.log.httpLevel === 'debug'
    const formatter = (req: IncomingMessage, res: ServerResponse, time: number) =>
        `${colorStatus(res.statusCode)} ${time} ` +
        `${req.headers.host} ${req.socket.remoteAddress} ` +
        `${req.method} ${req.url}`
    const objFormatter = (req: IncomingMessage, res: ServerResponse) => ({
        req: stdSerializers.req(req),
        res: stdSerializers.res(res),
    })
    const responseTime = (args: IArguments) => args.length > 3 && args[3].responseTime
    return pinoHttp(
        {
            name: 'http',
            level: config.log.httpLevel,
            customAttributeKeys: {
                req: '_req',
                res: '_res',
            },
            customSuccessObject: isDebug
                ? (req, res, val) => objFormatter(req, res)
                : (req, res, val) => undefined,
            customSuccessMessage: formatter,
            customErrorObject: isDebug ? undefined : (req, res, err) => err,
            customErrorMessage: (req, res, err) =>
                // eslint-disable-next-line prefer-rest-params
                formatter(req, res, responseTime(arguments)),
            customLogLevel: (req, res, err) => {
                if (res.statusCode >= 400 && res.statusCode < 500) {
                    return 'warn'
                } else if (res.statusCode >= 500 || err) {
                    return 'error'
                } else {
                    return 'info'
                }
            },
        },
        getStream()
    )
}

export function getWaLogger (instanceId: string) {
    return getWaPinoLogger('wasock', instanceId)
}

export function getWaCacheLogger (instanceId: string) {
    return getWaPinoLogger('cache', instanceId)
}

export function getWaQrLogger () {
    return config.log.waLevel === 'debug'
}

function getWaPinoLogger (name: string, instanceId: string): WaLogger {
    return pino(
        {
            name: `${name}/${instanceId}`,
            level: config.log.waLevel,
        },
        getStream()
    ) as unknown as WaLogger
}

export default function getLogger (name: string, instanceId?: string) {
    return pino(
        {
            name: instanceId ? `${name}/${instanceId}` : name,
            level: config.log.level,
        },
        getStream()
    )
}
