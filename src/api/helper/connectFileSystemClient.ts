import { AppType } from './types'
import lockfile from 'proper-lockfile'
import config from '../../config/config'
import Database, { Keyed, Record, Table, Value } from '../models/db.model'
import Chat from '../models/chat.model'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import getLogger from '../../config/logging'

const logger = getLogger('database')

// Promisified version of fs methods for asynchronous operations
const writeFile = util.promisify(fs.writeFile)
const readFile = util.promisify(fs.readFile)
const unlink = util.promisify(fs.unlink)
const readdir = util.promisify(fs.readdir)
const mkdir = util.promisify(fs.mkdir)

class FsRecord<T> {
    fsTable: FsTable<T>
    record: Keyed<T>

    constructor(fsTable: FsTable<T>, record: Keyed<T>) {
        this.fsTable = fsTable
        this.record = record
    }

    async save(): Promise<void> {
        await this.fsTable.updateOne(this.record, this.record)
    }
}

class FsTable<T> extends Table<T> {
    filePath: string

    constructor(directory: string, name: string) {
        super()
        this.filePath = path.join(directory, `${name}.json`)
        this.name = name
    }

    getKey = (obj: Keyed<T>) => 
        ('key' in obj ? obj.key : '_id' in obj ? obj._id : '')

    keyPredicate = (find: Keyed<T>) => (obj: Keyed<T>) =>
        this.getKey(find) === this.getKey(obj)

    async load(): Promise<Keyed<T>[]> {
        try {
            const data = await readFile(this.filePath, 'utf-8')
            return JSON.parse(data)
        } catch (err: any) {
            // If file doesn't exist yet, return an empty array
            if (err.code === 'ENOENT') {
                return []
            }
            throw err
        }
    }

    async save(records: Keyed<T>[]): Promise<void> {
        await writeFile(this.filePath, JSON.stringify(records, null, 2), 'utf-8')
    }

    record(record: Keyed<T>): Keyed<T> & Record {
        const fileRecord = new FsRecord(this, record) as Record
        return Object.assign(fileRecord, record);
    }

    async replaceOne(indexer: Keyed<T>, record: T, options?: { upsert: boolean }): Promise<void> {
        logger.debug([indexer, record, options], 'replace one')
        try {
            const records = await this.load()
            let index = records.findIndex(this.keyPredicate(indexer))
            if (index !== -1 || options?.upsert) {
                if (index < 0) index = records.length
                records[index] = { ...record, ...indexer }
                await this.save(records)
            }
        } finally {
            release()
        }
    }
  
    async updateOne(indexer: Keyed<T>, record: Partial<T>, options?: { upsert: boolean }): Promise<void> {
        logger.debug([indexer, record, options], 'update one')
        try {
            const records = await this.load()
            let index = records.findIndex(this.keyPredicate(indexer))
            if (index !== -1 || options?.upsert) {
                if (index < 0) index = records.length
                records[index] = { ...records[index], ...record }
                await this.save(records)
            }
        } finally {
            release()
        }
    }

    async deleteOne(indexer: Keyed<T>): Promise<void> {
        logger.debug([indexer], 'delete one')
        try {
            const records = await this.load()
            const index = records.findIndex(this.keyPredicate(indexer))
            if (index !== -1) {
                records.splice(index, 1)
                await this.save(records)
            }
        } finally {
            release()
        }
    }

    async findOneAndDelete(indexer: Keyed<T>): Promise<Value<T> | null> {
        logger.debug([indexer], 'find and delete one')
        try {
            const records = await this.load()
            const index = records.findIndex(this.keyPredicate(indexer))
            if (index !== -1) {
                const record = records[index]
                records.splice(index, 1)
                await this.save(records)
                return { value: record as T }
            }
            return null
        } finally {
            release()
        }
    }

    async findOne(indexer: Keyed<T>): Promise<T | null> {
        logger.debug([indexer], 'find one')
        try {
            const records = await this.load()
            return records.find(this.keyPredicate(indexer)) as T
        } finally {
            release()
        }
    }

    async find(indexer: Keyed<T>): Promise<T[]> {
        logger.debug([indexer], 'find query')
        try {
            const records = await this.load()
            return records.filter(this.keyPredicate(indexer)).map((r) => r as T)
        } finally {
            release()
        }
    }

    async drop(): Promise<void> {
        logger.debug([], 'drop table')
        try {
            await unlink(this.filePath)
        } finally {
            release()
        }        
    }
}

class FsDatabase extends Database {
    directory: string
    Chat: Table<Chat>

    // eslint-disable-next-line @typescript-eslint/ban-types
    constructor(directory: string, options: {}) {
        super()
        this.directory = directory
        this.Chat = this.table('Chat')
    }

    async listTable(): Promise<Table<any>[]> {
        const fileNames = await readdir(this.directory)
        return fileNames
            .filter((name) => name.endsWith('.json'))
            .map((name) => this.table(path.basename(name, '.json')))
    }

    table(name: string): Table<any> {
        return new FsTable(this.directory, name)
    }
}

export default async function connectFileSystemClient(app: AppType) {
    const path = config.localfs.path
    const options = config.localfs.options

    try {
        await mkdir(path, { recursive: true })
        return new FsDatabase(path, options)
    } catch (error) {
        logger.error('STATE: Connection to file system failed!', error)
        process.exit()
    }
}
