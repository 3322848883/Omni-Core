require('dotenv').config({ path: require('path').resolve(__dirname, '.env.production') });

/** @type {Object.<string, import('knex').Knex.Config>} */
const config = {
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

module.exports = config;
