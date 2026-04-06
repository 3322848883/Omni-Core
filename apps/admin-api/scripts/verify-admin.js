const knex = require('knex');

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'omnicore',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'omnicore_admin',
  },
});

async function verifyAdmin() {
  try {
    const admins = await db('admin_users').select('id', 'username', 'email', 'role', 'is_active');
    console.log('Admin users:');
    console.table(admins);
    
    if (admins.length === 0) {
      console.log('\n⚠️ No admin users found!');
    } else {
      console.log(`\n✅ Found ${admins.length} admin user(s)`);
      console.log('\nDefault login credentials:');
      console.log('Username: admin');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

verifyAdmin();
