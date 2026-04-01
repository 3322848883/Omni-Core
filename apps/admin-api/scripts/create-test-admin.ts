import { db } from '../src/database';
import bcrypt from 'bcryptjs';

async function createTestAdmin() {
  try {
    // Check if test admin already exists
    const existingAdmin = await db('admin_users').where('username', 'admin').first();
    if (existingAdmin) {
      console.log('Test admin already exists:', existingAdmin.username);
      return;
    }

    // Hash password
    const passwordHash = bcrypt.hashSync('admin123', 10);

    const [id] = await db('admin_users').insert({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      role: 'super_admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('Test admin created successfully:');
    console.log('  ID:', id);
    console.log('  Username: admin');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('  Role: super_admin');

  } catch (error) {
    console.error('Failed to create test admin:', error);
  } finally {
    await db.destroy();
  }
}

createTestAdmin();
