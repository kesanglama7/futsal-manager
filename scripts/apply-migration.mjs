import { createRequire } from "module"
const require = createRequire(process.cwd() + "/package.json")
require("dotenv").config()
const pg = require("pg")
const fs = require("fs")

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL,
  connectionTimeoutMillis: 20000,
})
const migrationName = process.argv[2]
const sqlFile = process.argv[3]

const CREATE_MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"              VARCHAR(64) NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
)
`

const sql = fs.readFileSync(sqlFile, "utf8")
const client = await pool.connect()
try {
  await client.query("BEGIN")
  await client.query(CREATE_MIGRATIONS_TABLE)
  await client.query(sql)
  await client.query(
    `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
     VALUES (gen_random_uuid()::text, 'manual', now(), $1, NULL, NULL, now(), 0)`,
    [migrationName]
  )
  await client.query("COMMIT")
  console.log("Applied migration:", migrationName)
} catch (e) {
  await client.query("ROLLBACK")
  console.error("Apply failed:", e.message)
} finally {
  client.release()
  await pool.end()
}
