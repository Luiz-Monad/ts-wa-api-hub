import { AppType } from '../helper/types'
const expressOasGenerator = require('express-oas-generator');
import config from '../../config/config'
import pino from 'pino'

const logger = pino()

interface SchemaService {
}

export async function initOpenApiService(app: AppType) {
    if (config.openapiSchema) {
        expressOasGenerator.handleResponses(app, {});
        logger.info('OpenAPI Schema enabled')
        app.set('OpenApiService', {} as SchemaService)
    }
}

export default function getOpenApiService(app: AppType): SchemaService {
    const OpenApiService: SchemaService = app.get('OpenApiService')
    return OpenApiService
}
