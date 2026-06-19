import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const dbUrl = process.env.SUPABASE_DB_URL;
if(!dbUrl){
  console.error('Set SUPABASE_DB_URL (Postgres connection string from Supabase Dashboard → Connect).');
  process.exit(1);
}

const sqlPath = resolve('supabase/migrations/20250619150000_postcards_share_id_rls.sql');
const sql = readFileSync(sqlPath, 'utf8');
const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log('Applied migration:', sqlPath);
} finally {
  await client.end();
}
