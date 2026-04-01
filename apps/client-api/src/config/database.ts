import knex, { Knex } from 'knex';

const dbConfig: Knex.Config = {
  client: 'mysql2',
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
  }
};

const db = knex(dbConfig);

export default db;