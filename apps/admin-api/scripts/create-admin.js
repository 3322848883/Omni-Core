const bcrypt = require('bcryptjs');
const knex = require('knex');

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'omni_admin',
  },
});

async function createAdmin() {
  try {
    // Check if admin already exists
    const existing = await db('admin_users').where({ username: 'admin' }).first();
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash password (default: admin123)
    const passwordHash = await bcrypt.hash('admin123', 12);

    // Insert admin user
    await db('admin_users').insert({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      role: 'super_admin',
      is_active: true,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await db.destroy();
  }
}

createAdmin();
