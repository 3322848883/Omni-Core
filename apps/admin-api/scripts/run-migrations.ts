import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import knex from 'knex';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

// Create knex instance
const db = knex({
  client: process.env.DB_CLIENT || 'better-sqlite3',
  connection: process.env.USE_SQLITE === 'true' 
    ? { filename: process.env.DB_FILENAME || './dev.sqlite3' }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        database: process.env.DB_NAME || 'omnicore_admin',
        user: process.env.DB_USER || 'omnicore',
        password: process.env.DB_PASSWORD || 'omnicore123',
      },
  migrations: {
    directory: path.resolve(__dirname, '..', 'src', 'database', 'migrations'),
    extension: 'ts',
  },
});

// Run migrations
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    await db.migrate.latest();
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runMigrations();
