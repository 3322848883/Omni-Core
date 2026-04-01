import knex, { Knex } from 'knex';
import { config } from '../config';
import { logger } from '../utils/logger';
import path from 'path';

const useSqlite = process.env.USE_SQLITE === 'true';

const dbConfig: Knex.Config = useSqlite ? {
  client: 'better-sqlite3',
  connection: {
    filename: process.env.DB_FILENAME || './dev.sqlite3'
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: path.join(__dirname, 'seeds')
  }
} : {
  client: process.env.DB_CLIENT || 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'omnicore_admin',
    user: process.env.DB_USER || 'omnicore',
    password: process.env.DB_PASSWORD || '',
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: path.join(__dirname, 'seeds')
  }
};

export const db = knex(dbConfig);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
}

// Run migrations
export async function runMigrations(): Promise<void> {
  try {
    await db.migrate.latest();
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Failed to run migrations:', error);
    throw error;
  }
}

// Run seeds
export async function runSeeds(): Promise<void> {
  try {
    await db.seed.run();
    logger.info('Database seeds completed successfully');
  } catch (error) {
    logger.error('Failed to run seeds:', error);
    throw error;
  }
}
