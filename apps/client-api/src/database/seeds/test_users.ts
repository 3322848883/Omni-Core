import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  // Inserts seed entries
  const hashedPassword = await bcrypt.hash('test12345', 10);
  
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
