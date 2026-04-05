"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seed(knex) {
    // Deletes ALL existing entries
    await knex('users').del();
    // Inserts seed entries
    const hashedPassword = await bcryptjs_1.default.hash('test12345', 10);
    await knex('users').insert([
        {
            user_id: 'user_test_001',
            email: 'test_final@example.com',
            username: 'testuser',
            password_hash: hashedPassword,
            status: 1, // active
            traffic_limit: 107374182400, // 100GB
            traffic_used: 5368709120, // 5GB
            expire_date: '2026-12-31',
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            user_id: 'user_test_002',
            email: 'demo@example.com',
            username: 'demouser',
            password_hash: hashedPassword,
            status: 1,
            traffic_limit: 53687091200, // 50GB
            traffic_used: 1073741824, // 1GB
            expire_date: '2026-06-30',
            created_at: new Date(),
            updated_at: new Date(),
        },
    ]);
    console.log('Test users seeded successfully');
}
//# sourceMappingURL=test_users.js.map