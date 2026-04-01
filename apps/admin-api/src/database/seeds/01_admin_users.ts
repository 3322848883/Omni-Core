import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('admin_users').del();

  // Hash password (default: admin123)
  const passwordHash = await bcrypt.hash('admin123', 12);

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
