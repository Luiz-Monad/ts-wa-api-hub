import dotenv from 'dotenv'
import mongoose from 'mongoose'
import pino from 'pino'

dotenv.config()
const logger = pino()

import http from 'http'
import app from './config/express'
import config from './config/config'

import connectToCluster from './api/helper/connectMongoClient'
import { ErrHandler } from './api/helper/types'

if (config.mongoose.enabled) {
    mongoose.set('strictQuery', true);
    mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
        logger.info('Connected to MongoDB')
    })
}

import { initSessionService } from './api/service/session'

const server = http.createServer(app)

server.listen(config.port, async () => {
    logger.info(`Listening on port ${config.port}`)
    await connectToCluster(app, config.mongoose.url)
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
