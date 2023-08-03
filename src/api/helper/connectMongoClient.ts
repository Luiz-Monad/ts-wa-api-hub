import { Collection, Db, MongoClient, Document, WithoutId } from 'mongodb'
import pino from 'pino'
import { AppType } from './types'
import config from '../../config/config'
import Database, { Keyed, Record, Table, Value } from '../models/db.model'
import Chat from '../models/chat.model'

class MongoRecord<T extends Document> {
    collection: Collection<T>
    record: Partial<T>

    constructor(collection: Collection<T>, record: Partial<T>) {
        this.collection = collection
        this.record = record
    }

    async save(): Promise<void> {
        await this.collection.updateOne(this.record, this.record)
    }    
}

class MongoTable<T extends Document> extends Table<T> {
    collection: Collection<T>
    
    constructor (db: Db, name: string) {
        super()
        this.collection = db.collection(name)
        this.name = name
    }

    record(record: Keyed<T>): Keyed<T> & Record {
        const mongoRecord = new MongoRecord(this.collection, record) as Record
        return { ...mongoRecord, ...record }
    }

    async replaceOne(indexer: Keyed<T>, record: T, options?: { upsert: boolean; }): Promise<void> {
        await this.collection.replaceOne(indexer, record, options ?? {})
    }
  
    async updateOne(indexer: Keyed<T>, record: Partial<T>, options?: { upsert: boolean; }): Promise<void> {
        await this.collection.updateOne(indexer, record, options ?? {})
    }

    async deleteOne(indexer: Keyed<T>): Promise<void> {
        await this.collection.deleteOne(indexer)
    }

    async findOneAndDelete(indexer: Keyed<T>): Promise<Value<T> | null> {
        return await this.collection.findOneAndDelete(indexer) as Value<T>
    }

    async findOne(indexer: Keyed<T>): Promise<T | null> {
        return await this.collection.findOne(indexer) as T
    }
  
    async find(indexer: Keyed<T>): Promise<T[] | null> {
        return (await this.collection.find(indexer).toArray()).map(r => r as T)
    }

    async drop(): Promise<void> {
        await this.collection.drop()        
    }
}

class MongoDatabase extends Database {
    db: Db
    Chat: Table<Chat>
    
    constructor (mongoClient: MongoClient) {
        super()
        this.db = mongoClient.db('whatsapp-api')
        this.Chat = this.table('Chat')
    }

    async listTable(): Promise<Table<any>[]> {
        const collections = await this.db.listCollections().toArray();
        return collections.map(c => this.table(c.name));
    }

    table(name: string): Table<any> {
        return new MongoTable(this.db, name)
    }
}


export default async function connectMongoClient(app: AppType) {
    const logger = pino()
    const uri = config.mongoose.url
    const options = config.mongoose.options
    
    try {
        const mongoClient = new MongoClient(uri, options)
        logger.info('STATE: Connecting to MongoDB')
        await mongoClient.connect()
        logger.info('STATE: Successfully connected to MongoDB')
        return new MongoDatabase(mongoClient)
    } catch (error) {
        logger.error('STATE: Connection to MongoDB failed!', error)
        process.exit()
    }
}
