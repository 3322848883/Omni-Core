"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db = (0, knex_1.default)({
    client: 'mysql2',
    connection: {
        host: 'localhost',
        port: 3306,
        database: 'omnicore_admin',
        user: 'omnicore',
        password: process.env.DB_PASSWORD || '',
    },
});
async function testLogin() {
    try {
        console.log('1. 查询用户...');
        const admin = await db('admin_users').where({ username: 'superadmin' }).first();
        console.log('用户存在:', !!admin);
        console.log('用户激活状态:', admin?.is_active);
        if (admin) {
            console.log('2. 验证密码...');
            console.log('密码哈希:', admin.password_hash.substring(0, 30) + '...');
            const isValid = await bcryptjs_1.default.compare('admin123', admin.password_hash);
            console.log('密码验证结果:', isValid);
        }
        else {
            console.log('用户不存在!');
        }
        await db.destroy();
    }
    catch (e) {
        console.error('错误:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
    process.exit(0);
}
testLogin();
//# sourceMappingURL=test-login.js.map