import { Collection, Db, MongoClient, Document, WithoutId } from 'mongodb'
import { AppType } from './types'
import config from '../../config/config'
import Database, { Keyed, Record, Table, Value } from '../models/db.model'
import Chat from '../models/chat.model'
import getLogger from '../../config/logging'

const logger = getLogger('database')

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

    constructor(db: Db, name: string) {
        super()
        this.collection = db.collection(name)
        this.name = name
    }

    record(record: Keyed<T>): Keyed<T> & Record {
        const mongoRecord = new MongoRecord(this.collection, record) as Record
        return Object.assign(mongoRecord, record)
    }

    async replaceOne(indexer: Keyed<T>, record: T, options?: { upsert: boolean }): Promise<void> {
        logger.debug({indexer, record, options}, 'replace one')
        await this.collection.replaceOne(indexer, record, options ?? {})
    }

    async updateOne(indexer: Keyed<T>, record: Partial<T>, options?: { upsert: boolean }): Promise<void> {
        logger.debug({indexer, record, options}, 'update one')
        await this.collection.updateOne(indexer, record, options ?? {})
    }

    async deleteOne(indexer: Keyed<T>): Promise<void> {
        logger.debug({indexer}, 'delete one')
        await this.collection.deleteOne(indexer)
    }

    async findOneAndDelete(indexer: Keyed<T>): Promise<Value<T> | null> {
        logger.debug({indexer}, 'find and delete one')
        return (await this.collection.findOneAndDelete(indexer)) as Value<T>
    }

    async findOne(indexer: Keyed<T>): Promise<T | null> {
        logger.debug({indexer}, 'find one')
        return (await this.collection.findOne(indexer)) as T
    }

    async find(indexer: Keyed<T>): Promise<T[] | null> {
        logger.debug({indexer}, 'find query')
        return (await this.collection.find(indexer).toArray()).map((r) => r as T)
    }

    async drop(): Promise<void> {
        logger.debug({}, 'drop table')
        await this.collection.drop()
    }
}

class MongoDatabase extends Database {
    db: Db
    Chat: Table<Chat>

    constructor(mongoClient: MongoClient) {
        super()
        this.db = mongoClient.db('whatsapp-api')
        this.Chat = this.table('Chat')
    }

    async listTable(): Promise<Table<any>[]> {
        const collections = await this.db.listCollections().toArray()
        return collections
            .filter((c) => c.name !== 'Chat')
            .map((c) => this.table(c.name))
    }

    table<T>(name: string): Table<T> {
        return new MongoTable<T & Document>(this.db, name)
    }
}

export default async function connectMongoClient(app: AppType) {
    const uri = config.mongodb.url
    const options = config.mongodb.options

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
