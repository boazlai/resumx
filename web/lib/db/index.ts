import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// For server-side use only. Never import this in client components.
const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it is not supported for "transaction" pool mode
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
