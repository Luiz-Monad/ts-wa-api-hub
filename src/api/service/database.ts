import config from '../../config/config'
import connectMongoClient from '../helper/connectMongoClient'
import connectFileSystemClient from '../helper/connectFileSystemClient'
import { AppType } from '../helper/types'
import Database from '../models/db.model'
import getLogger from '../../config/logging'

const logger = getLogger('database')

export async function initDatabaseService(app: AppType) {
    let database: Database | null = null

    switch (config.database.kind) {
        case 'mongodb':
            database = await connectMongoClient(app)
            break
        case 'localfs':
            database = await connectFileSystemClient(app)
            break
    }
    if (!database) return

    logger.info(`Database enabled: ${config.database.kind}`)
    app.set('databaseService', database)
}

export default function getDatabaseService(app: AppType): Database {
    const DatabaseService: Database = app.get('databaseService')
    return DatabaseService
}
