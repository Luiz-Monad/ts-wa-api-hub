import dotenv from 'dotenv'
import pino from 'pino'

dotenv.config()
const logger = pino()

import http from 'http'
import app from './config/express'
import config from './config/config'

import { ErrHandler } from './api/helper/types'

import { initDatabaseService } from './api/service/database'
import { initInstanceService } from './api/service/instance'
import { initSessionService } from './api/service/session'

const server = http.createServer(app)

server.listen(config.port, async () => {
    logger.info(`Listening on port ${config.port}`)

    await initDatabaseService(app)
    await initInstanceService(app)    
    await initSessionService(app, server)
})

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed')
            process.exit(1)
        })
    } else {
        process.exit(1)
    }
}

const unexpectedErrorHandler : ErrHandler = (error) => {
    logger.error(error)
    exitHandler()
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