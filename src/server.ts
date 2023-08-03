import dotenv from 'dotenv'
dotenv.config()

import getLogger from './config/logging'
const logger = getLogger('server')

import http from 'http'
import app from './config/express'
import config from './config/config'

import { ErrHandler } from './api/helper/types'

import { initOpenApiService } from './api/service/oas'
import { initDatabaseService } from './api/service/database'
import { initInstanceService } from './api/service/instance'
import { initSessionService } from './api/service/session'
import { initCallbackService } from './api/service/callback'
import { initWebHookService } from './api/service/webhook'
import { initWebSocketService } from './api/service/websocket'

const server = http.createServer(app)

server.listen(config.port, async () => {
    logger.info(`Listening on port ${config.port}`)

    await initOpenApiService(app)
    await initDatabaseService(app)
    await initInstanceService(app)
    await initSessionService(app)
    await initCallbackService(app, server)
    await initWebHookService(app, server)
    await initWebSocketService(app, server)
})

const unexpectedErrorHandler: ErrHandler = (error) => {
    logger.error(error)
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)

process.on('SIGTERM', () => {
    logger.info('SIGTERM received')
    if (server) {
        server.close()
    }
})

export default server
