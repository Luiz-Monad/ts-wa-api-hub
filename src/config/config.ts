import dotenv from 'dotenv'
dotenv.config()

// ==================================
// SECURITY CONFIGURATION
// ==================================
const TOKEN = process.env.TOKEN || ''
const PROTECT_ROUTES = !!(process.env.PROTECT_ROUTES && process.env.PROTECT_ROUTES === 'true')

// ==================================
// APPLICATION CONFIGURATION
// ==================================
const PORT = process.env.PORT || '3333'
const APP_URL = process.env.APP_URL || false
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const WA_LOG_LEVEL = process.env.WA_LOG_LEVEL || 'info'
const HTTP_LOG_LEVEL = process.env.HTTP_LOG_LEVEL || 'info'

// ==================================
// INSTANCE CONFIGURATION
// ==================================
const INSTANCE_MAX_RETRY_QR = process.env.INSTANCE_MAX_RETRY_QR || 5
const INSTANCE_MAX_RETRY_INIT = process.env.INSTANCE_MAX_RETRY_INIT || 5
const RESTORE_SESSIONS_ON_START_UP = !!(process.env.RESTORE_SESSIONS_ON_START_UP && process.env.RESTORE_SESSIONS_ON_START_UP === 'true')

// ==================================
// BROWSER CONFIGURATION
// ==================================
const CLIENT_PLATFORM = process.env.CLIENT_PLATFORM || 'Whatsapp MD'
const CLIENT_BROWSER = process.env.CLIENT_BROWSER || 'Chrome'
const CLIENT_VERSION = process.env.CLIENT_VERSION || '4.0.0'

// ==================================
// DATABASE CONFIGURATION
// ==================================
// Enable or disable storage alltogether
const DATABASE_ENABLED = !!(process.env.DATABASE_ENABLED && process.env.DATABASE_ENABLED === 'true')
// What kind of storage to use:
type DATABASE_KIND_TYPE = 'mongodb' | 'localfs' | 'azuretable'
const DATABASE_KIND = <DATABASE_KIND_TYPE>process.env.DATABASE_KIND || 'localfs'

// LOCALFS CONFIGURATION
// ----------------------------------
// Path of the file system storage
const LOCALFS_PATH = process.env.LOCALFS_PATH || 'tmp'

// AZURETABLE CONFIGURATION
// ----------------------------------
// URL of the Azure Table
const AZURETABLE_URL = process.env.AZURETABLE_URL || 'https://storageaccount.core.windows.net'

// MONGODB CONFIGURATION
// ----------------------------------
// Enable or disable Mongo DB
const MONGODB_ENABLED = !!(process.env.MONGODB_ENABLED && process.env.MONGODB_ENABLED === 'true')
// URL of the Mongo DB
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/WhatsAppInstance'

// ==================================
// WEBHOOK CONFIGURATION
// ==================================
// Enable or disable webhook globally on project
const WEBHOOK_ENABLED = !!(process.env.WEBHOOK_ENABLED && process.env.WEBHOOK_ENABLED === 'true')
// Webhook URL
const WEBHOOK_URL = process.env.WEBHOOK_URL
// Receive message content in webhook (Base64 format)
const WEBHOOK_BASE64 = !!(process.env.WEBHOOK_BASE64 && process.env.WEBHOOK_BASE64 === 'true')
// allowed events which should be sent to webhook
const WEBHOOK_ALLOWED_EVENTS = process.env.WEBHOOK_ALLOWED_EVENTS

// ==================================
// WEBSOCKET CONFIGURATION
// ==================================
// Enable or disable websockets globally on project
const WEBSOCKET_ENABLED = !!(process.env.WEBSOCKET_ENABLED && process.env.WEBSOCKET_ENABLED === 'true')
// allowed events which should be sent to websocket
const WEBSOCKET_ALLOWED_EVENTS = process.env.WEBSOCKET_ALLOWED_EVENTS

// ==================================
// MESSAGE CONFIGURATION
// ==================================
// Mark messages as seen
const MARK_MESSAGES_READ = !!(process.env.MARK_MESSAGES_READ && process.env.MARK_MESSAGES_READ === 'true')

// ==================================
// EXPORT
// ==================================
export default {
    port: PORT,
    token: TOKEN,
    appUrl: APP_URL,
    log: {
        level: LOG_LEVEL,
        waLevel: WA_LOG_LEVEL,
        httpLevel: HTTP_LOG_LEVEL,
    },
    instance: {
        maxRetryQr: INSTANCE_MAX_RETRY_QR,
        maxRetryInit: INSTANCE_MAX_RETRY_INIT,
        restoreSessionsOnStartup: RESTORE_SESSIONS_ON_START_UP,
        markMessagesRead: MARK_MESSAGES_READ,
    },
    database: {
        enabled: MONGODB_ENABLED || DATABASE_ENABLED,
        kind: MONGODB_ENABLED ? 'mongodb' : DATABASE_KIND,
    },
    localfs: {
        path: LOCALFS_PATH,
        options: {},
    },
    azuretable: {
        url: AZURETABLE_URL,
        options: {},
    },
    mongodb: {
        url: MONGODB_URL,
        options: {
            // useCreateIndex: true,
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        },
    },
    browser: {
        platform: CLIENT_PLATFORM,
        browser: CLIENT_BROWSER,
        version: CLIENT_VERSION,
    },
    webhookEnabled: WEBHOOK_ENABLED,
    webhookUrl: WEBHOOK_URL,
    webhookBase64: WEBHOOK_BASE64,
    webhookAllowedEvents: WEBHOOK_ALLOWED_EVENTS,
    websocketEnabled: WEBSOCKET_ENABLED,
    websocketAllowedEvents: WEBSOCKET_ALLOWED_EVENTS,
    protectRoutes: PROTECT_ROUTES,
}
