"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seed(knex) {
    // Deletes ALL existing entries
    await knex('admin_users').del();
    // Hash password (default: admin123)
    const passwordHash = await bcryptjs_1.default.hash('admin123', 12);
    // Inserts seed entries
    await knex('admin_users').insert([
        {
            username: 'superadmin',
            email: 'superadmin@fgvpn.com',
            password_hash: passwordHash,
            role: 'super_admin',
            is_active: true,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
        {
            username: 'admin',
            email: 'admin@fgvpn.com',
            password_hash: passwordHash,
            role: 'admin',
            is_active: true,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
        {
            username: 'operator',
            email: 'operator@fgvpn.com',
            password_hash: passwordHash,
            role: 'operator',
            is_active: true,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
    ]);
}
//# sourceMappingURL=01_admin_users.js.map