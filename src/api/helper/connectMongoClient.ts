import { Collection, Db, MongoClient, Document, Filter, WithId, WithoutId } from 'mongodb'
import { AppType } from './types'
import config from '../../config/config'
import Database, { Keyed, Record, Table, Value } from '../models/db.model'
import Chat from '../models/chat.model'
import getLogger from '../../config/logging'

const logger = getLogger('database')

function toFilter<T extends Document> (index: Keyed<T>): Filter<T> {
    const { _id, key, ...extra } = index
    return { _id, key, ...extra }
}

function toBoxed<T> (obj: WithId<T> | null): Value<T> | null {
    if (obj === null) return null
    return { value: toUnboxed(obj) }
}

function toUnboxedOrNull<T> (obj: WithId<T> | null): T | null {
    if (obj === null) return null
    return toUnboxed(obj)
}

function toUnboxed<T> (obj: WithId<T>): T {
    return obj as T
}

class MongoRecord<T extends Document> {
    collection: Collection<T>
    record: Partial<T>

    constructor (collection: Collection<T>, record: Partial<T>) {
        this.collection = collection
        this.record = record
    }

    async save (): Promise<void> {
        await this.collection.updateOne(toFilter(this.record), this.record)
    }
}

class MongoTable<T extends Document> extends Table<T> {
    collection: Collection<T>

    constructor (db: Db, name: string) {
        super()
        this.collection = db.collection(name)
        this.name = name
    }

    record (record: Keyed<T>): Keyed<T> & Record {
        const mongoRecord = new MongoRecord(this.collection, record) as Record
        return Object.assign(mongoRecord, record)
    }

    async replaceOne (
        indexer: Keyed<T>,
        record: T,
        options?: { upsert: boolean }
    ): Promise<void> {
        logger.debug({ indexer, record, options }, 'replace one')
        await this.collection.replaceOne(toFilter(indexer), record, options ?? {})
    }

    async updateOne (
        indexer: Keyed<T>,
        record: Partial<T>,
        options?: { upsert: boolean }
    ): Promise<void> {
        logger.debug({ indexer, record, options }, 'update one')
        await this.collection.updateOne(toFilter(indexer), record, options ?? {})
    }

    async deleteOne (indexer: Keyed<T>): Promise<void> {
        logger.debug({ indexer }, 'delete one')
        await this.collection.deleteOne(toFilter(indexer))
    }

    async findOneAndDelete (indexer: Keyed<T>): Promise<Value<T> | null> {
        logger.debug({ indexer }, 'find and delete one')
        return toBoxed(await this.collection.findOneAndDelete(toFilter(indexer)))
    }

    async findOne (indexer: Keyed<T>): Promise<T | null> {
        logger.debug({ indexer }, 'find one')
        return toUnboxedOrNull(await this.collection.findOne(toFilter(indexer)))
    }

    async find (indexer: Keyed<T>): Promise<T[] | null> {
        logger.debug({ indexer }, 'find query')
        return (await this.collection.find(toFilter(indexer)).toArray()).map(toUnboxed)
    }

    async drop (): Promise<void> {
        logger.debug({}, 'drop table')
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

    async listTable<T> (): Promise<Table<T>[]> {
        const collections = await this.db.listCollections().toArray()
        return collections.filter((c) => c.name !== 'Chat').map((c) => this.table(c.name))
    }

    table<T> (name: string): Table<T> {
        return new MongoTable<T & Document>(this.db, name)
    }
}

export default async function connectMongoClient (app: AppType) {
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
