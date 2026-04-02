"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.testConnection = testConnection;
exports.runMigrations = runMigrations;
exports.runSeeds = runSeeds;
const knex_1 = __importDefault(require("knex"));
const logger_1 = require("../utils/logger");
const dbConfig = {
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
    },
    migrations: {
        directory: './migrations',
        tableName: 'knex_migrations'
    },
    seeds: {
        directory: './seeds'
    }
};
exports.db = (0, knex_1.default)(dbConfig);
// Test database connection
async function testConnection() {
    try {
        await exports.db.raw('SELECT 1');
        logger_1.logger.info('Database connection established successfully');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to database:', error);
        return false;
    }
}
// Run migrations
async function runMigrations() {
    try {
        await exports.db.migrate.latest();
        logger_1.logger.info('Database migrations completed successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to run migrations:', error);
        throw error;
    }
}
// Run seeds
async function runSeeds() {
    try {
        await exports.db.seed.run();
        logger_1.logger.info('Database seeds completed successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to run seeds:', error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map