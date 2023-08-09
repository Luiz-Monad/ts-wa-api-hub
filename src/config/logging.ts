import pino from 'pino'
import prettyPrint from 'pino-pretty'

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

function getRandomUnusedColor(): number {
    const unusedColors = colorCodes.filter(code => !usedColors[code])
    if (unusedColors.length === 0) {
        // All colors have been used, just select a random color
        return colorCodes[Math.floor(Math.random() * colorCodes.length)]
    } else {
        const selected = unusedColors[Math.floor(Math.random() * unusedColors.length)]
        usedColors[selected] = true
        return selected
    }
}

function getColorForLogger(loggerName: string): number {
    if (!loggerColors[loggerName]) {
        loggerColors[loggerName] = getRandomUnusedColor()
    }
    return loggerColors[loggerName]
}

function getAnsiColor(code: number): string {
    return `\x1b[${code}m`
}

function colorizeMessage(loggerName: string): string {
    const colorCode = getColorForLogger(loggerName)
    return `${getAnsiColor(colorCode)}${loggerName}\x1b[0m`
}

export default function getLogger(name: string, logLevel: string = 'silent') {
    return pino({
        name: name,
        logLevel: logLevel,
    }, prettyPrint({
        customPrettifiers: {
            name: msg => colorizeMessage(`${msg}`),
        },
        // messageFormat: (log, messageKey) => {
        //     return message(`${log[messageKey]}`)
        // }
    }))
}
