import knex from 'knex';
import bcrypt from 'bcryptjs';

const db = knex({
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
      const isValid = await bcrypt.compare('admin123', admin.password_hash);
      console.log('密码验证结果:', isValid);
    } else {
      console.log('用户不存在!');
    }
    
    await db.destroy();
  } catch (e: any) {
    console.error('错误:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
  process.exit(0);
}

testLogin();
