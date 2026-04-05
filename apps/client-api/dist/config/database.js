"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
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
    }
};
const db = (0, knex_1.default)(dbConfig);
exports.default = db;
//# sourceMappingURL=database.js.map