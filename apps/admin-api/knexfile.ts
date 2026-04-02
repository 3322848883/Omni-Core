import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';
dotenv.config({ path: path.resolve(__dirname, envFile) });

const config: { [key: string]: Knex.Config } = {
  development: {
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
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts',
    },
  },
  production: {
    client: process.env.DB_CLIENT || 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME || 'omnicore_admin',
      user: process.env.DB_USER || 'omnicore',
      password: process.env.DB_PASSWORD || 'omnicore123',
    },
    pool: {
      min: 5,
      max: 20,
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts',
    },
  },
};

export default config;
