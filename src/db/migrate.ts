import 'dotenv/config'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from './connection'

migrate(db, { migrationsFolder: './src/db/migrations' })
  .then(() => {
    console.log('Migration complete')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed', err)
    process.exit(1)
  })