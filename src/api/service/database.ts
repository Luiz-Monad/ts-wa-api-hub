import { Document, Collection, MongoClient } from 'mongodb'
import mongoose from 'mongoose'
import config from '../../config/config'
import pino from 'pino'
import { AppType } from '../helper/types'
import connectMongoClient from '../helper/connectMongoClient'

const logger = pino()

interface Database
{
    mongoClient: MongoClient
}

export type CollectionType = Collection<Document>

export async function initDatabaseService(app: AppType) {
    if (config.mongoose.enabled) {
        mongoose.set('strictQuery', true);
        mongoose.connect(config.mongoose.url, config.mongoose.options, () => {
            logger.info('Connected to MongoDB')
        })
    }    
    const mongoClient = await connectMongoClient()
    app.set('databaseService', { mongoClient } as Database);
}

export function getDatabaseService(app: AppType): Database {
    const DatabaseService: Database = app.get('databaseService');
    return DatabaseService;
}

export default function getDatabase(app: AppType) {
    return getDatabaseService(app).mongoClient.db('whatsapp-api')
}
