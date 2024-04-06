import { AppType } from './types'
import lockfile from 'proper-lockfile'
import config from '../../config/config'
import Database, { Keyed, Record, Table, Value } from '../models/db.model'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import getLogger from '../../config/logging'
import sanitize from 'sanitize-filename'

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

    constructor (fsTable: FsTable<T>, record: Keyed<T>) {
        this.fsTable = fsTable
        this.record = record
    }

    async save (): Promise<void> {
        await this.fsTable.updateOne(this.record, this.record)
    }
}

class FsTable<T> extends Table<T> {
    filePath: string

    constructor (directory: string, name: string) {
        super()
        this.name = sanitize(name, { replacement: '_' })
        this.filePath = path.join(directory, `${name}.json`)
    }

    async lock (): Promise<() => Promise<void>> {
        return await lockfile.lock(this.filePath, { realpath: false, retries: 16 })
    }

    getKey = (obj: Keyed<T>) => ('key' in obj ? obj.key : '_id' in obj ? obj._id : '')

    keyPredicate = (find: Keyed<T>) => (obj: Keyed<T>) =>
        this.getKey(find) === this.getKey(obj)

    async load (): Promise<Keyed<T>[]> {
        try {
            const data = await readFile(this.filePath, 'utf-8')
            return JSON.parse(data)
        } catch (err) {
            const nErr = err as NodeJS.ErrnoException
            // If file doesn't exist yet, return an empty array
            if (nErr.code === 'ENOENT') {
                return []
            }
            throw nErr
        }
    }

    async save (records: Keyed<T>[]): Promise<void> {
        await writeFile(this.filePath, JSON.stringify(records, null, 2), 'utf-8')
    }

    record (record: Keyed<T>): Keyed<T> & Record {
        const fileRecord = new FsRecord(this, record) as Record
        return Object.assign(fileRecord, record)
    }

    async replaceOne (
        indexer: Keyed<T>,
        record: T,
        options?: { upsert: boolean }
    ): Promise<void> {
        logger.debug({ indexer, record, options }, 'replace one')
        const release = await this.lock()
        try {
            const records = await this.load()
            let index = records.findIndex(this.keyPredicate(indexer))
            if (index !== -1 || options?.upsert) {
                if (index < 0) index = records.length
                records[index] = { ...record, ...indexer }
                await this.save(records)
            }
        } catch (err) {
            logger.error(err, 'replace one')
        } finally {
            release()
        }
    }

    async updateOne (
        indexer: Keyed<T>,
        record: Partial<T>,
        options?: { upsert: boolean }
    ): Promise<void> {
        logger.debug({ indexer, record, options }, 'update one')
        const release = await this.lock()
        try {
            const records = await this.load()
            let index = records.findIndex(this.keyPredicate(indexer))
            if (index !== -1 || options?.upsert) {
                if (index < 0) index = records.length
                records[index] = { ...records[index], ...record }
                await this.save(records)
            }
        } catch (err) {
            logger.error(err, 'update one')
            throw err
        } finally {
            release()
        }
    }

    async deleteOne (indexer: Keyed<T>): Promise<void> {
        logger.debug({ indexer }, 'delete one')
        const release = await this.lock()
        try {
            const records = await this.load()
            const index = records.findIndex(this.keyPredicate(indexer))
            if (index !== -1) {
                records.splice(index, 1)
                await this.save(records)
            }
        } catch (err) {
            logger.error(err, 'delete one')
            throw err
        } finally {
            release()
        }
    }

    async findOneAndDelete (indexer: Keyed<T>): Promise<Value<T> | null> {
        logger.debug({ indexer }, 'find and delete one')
        const release = await this.lock()
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
        } catch (err) {
            logger.error(err, 'find and delete one')
            throw err
        } finally {
            release()
        }
    }

    async findOne (indexer: Keyed<T>): Promise<T | null> {
        logger.debug({ indexer }, 'find one')
        const release = await this.lock()
        try {
            const records = await this.load()
            return records.find(this.keyPredicate(indexer)) as T
        } catch (err) {
            logger.error(err, 'find one')
            throw err
        } finally {
            release()
        }
    }

    async find (indexer: Keyed<T>): Promise<T[]> {
        logger.debug({ indexer }, 'find query')
        const release = await this.lock()
        try {
            const records = await this.load()
            return records.filter(this.keyPredicate(indexer)).map((r) => r as T)
        } catch (err) {
            logger.error(err, 'find query')
            throw err
        } finally {
            release()
        }
    }

    async drop (): Promise<void> {
        logger.debug({}, 'drop table')
        const release = await this.lock()
        try {
            await unlink(this.filePath)
        } catch (err) {
            logger.warn(err, 'find and delete one')
        } finally {
            release()
        }
    }
}

class FsDatabase extends Database {
    directory: string

    // eslint-disable-next-line @typescript-eslint/ban-types
    constructor (directory: string, options: {}) {
        super()
        this.directory = directory
    }

    async listTable<T> (): Promise<Table<T>[]> {
        const fileNames = await readdir(this.directory)
        return fileNames.map((name) => this.table(path.basename(name, '.json')))
    }

    table<T> (name: string): Table<T> {
        return new FsTable<T>(this.directory, name)
    }
}

export default async function connectFileSystemClient (app: AppType) {
    const path = config.localfs.path
    const options = config.localfs.options

    try {
        await mkdir(path, { recursive: true })
        logger.info('STATE: Successfully connected to file system')
        return new FsDatabase(path, options)
    } catch (err) {
        logger.error(err, 'STATE: Connection to file system failed!')
        process.exit()
    }
}
