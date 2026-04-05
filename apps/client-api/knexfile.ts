import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(__dirname, envFile) });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: process.env.DB_CLIENT || 'sqlite3',
    connection: {
      filename: process.env.DB_FILENAME || './data/fgvpn.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME || 'omnicore_client',
      user: process.env.DB_USER || 'omnicore',
      password: process.env.DB_PASSWORD || 'omnicore123',
    },
    pool: {
      min: 5,
      max: 20,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },
};

export default config;
