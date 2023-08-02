import { MongoClient } from 'mongodb'
import pino from 'pino'
import config from '../../config/config'

export default async function connectMongoClient() {
    const logger = pino()
    const uri = config.mongoose.url
    const options = config.mongoose.options
    
    try {
        const mongoClient = new MongoClient(uri, options)
        logger.info('STATE: Connecting to MongoDB')
        await mongoClient.connect()
        logger.info('STATE: Successfully connected to MongoDB')
        return mongoClient
    } catch (error) {
        logger.error('STATE: Connection to MongoDB failed!', error)
        process.exit()
    }
}
