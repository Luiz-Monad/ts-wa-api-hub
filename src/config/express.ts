import path from 'path'
import express from 'express'
import exceptionHandler from 'express-exception-handler'
import cors from 'cors'
import pinoHttp from 'pino-http'
import * as error from '../api/middlewares/error'
import tokenCheck from '../api/middlewares/tokenCheck'
import config from './config'

exceptionHandler.handle()
const app = express()

if (!config.protectRoutes) {
    app.options('*', cors())
}

if (config.log.httpLevel !== "silent") {
    app.use(pinoHttp({
        name: 'http',    
        level: config.log.httpLevel,
    }))
}

app.use(express.json())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../api/views'))

import routes from '../api/routes/'
if (config.protectRoutes) {
    app.use(tokenCheck)
}
app.use('/frontend', express.static('../frontend'))
app.use('/', routes)
app.use(error.handler)

export default app
