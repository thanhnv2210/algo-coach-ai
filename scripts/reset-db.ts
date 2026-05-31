import postgres from "postgres"

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 })
  await client`DROP SCHEMA IF EXISTS algo_coach CASCADE`
  await client`DROP TABLE IF EXISTS drizzle.__drizzle_migrations`
  console.log("Schema algo_coach dropped.")
  await client.end()
}

main().catch(console.error)
