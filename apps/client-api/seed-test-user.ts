import db from './src/config/database';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash('test12345', 10);
    
    // Check if user exists
    const existingUser = await db('users').where({ email: 'test_final@example.com' }).first();
    
    if (existingUser) {
      console.log('Test user already exists');
      process.exit(0);
    }
    
    await db('users').insert([
      {
        user_id: 'user_test_001',
        email: 'test_final@example.com',
        username: 'testuser',
        password_hash: hashedPassword,
        status: 1,
        traffic_limit: 107374182400,
        traffic_used: 5368709120,
        expire_date: '2026-12-31',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);
    
    console.log('Test user seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
}

seed();
