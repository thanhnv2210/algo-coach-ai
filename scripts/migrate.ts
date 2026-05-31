import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 })
  await client`CREATE SCHEMA IF NOT EXISTS algo_coach`
  const db = drizzle(client)
  await migrate(db, { migrationsFolder: "./drizzle" })
  console.log("Migrations applied.")
  await client.end()
}

main().catch(console.error)
