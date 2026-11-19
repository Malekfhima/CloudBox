import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://cloudbox:cloudbox@127.0.0.1:5432/cloudbox';
const migrationsDir = path.resolve(process.cwd(), 'server/db/migrations');

async function migrate() {
  const sql = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000 });
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS __cloudbox_migrations (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name text NOT NULL UNIQUE,
        checksum text NOT NULL,
        applied_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `);

    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const contents = fs.readFileSync(fullPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(contents).digest('hex');
      const appliedResult = await sql.query(
        'SELECT checksum FROM __cloudbox_migrations WHERE name = $1',
        [file],
      );
      const applied = appliedResult.rows[0];
      if (applied) {
        if (applied.checksum !== checksum) {
          throw new Error(`Migration ${file} changed after it was applied`);
        }
        continue;
      }

      const client = await sql.connect();
      try {
        await client.query('BEGIN');
        for (const statement of contents.split('--> statement-breakpoint')) {
          const query = statement.trim();
          if (query) await client.query(query);
        }
        await client.query(
          'INSERT INTO __cloudbox_migrations (name, checksum) VALUES ($1, $2)',
          [file, checksum],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      console.log(`Applied migration ${file}`);
    }
  } finally {
    await sql.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
