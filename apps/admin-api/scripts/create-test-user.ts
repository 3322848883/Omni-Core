import { db } from '../src/database';

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await db('users').where('email', 'test@example.com').first();
    if (existingUser) {
      console.log('Test user already exists:', existingUser.user_id);
      return;
    }

    // Generate UUIDs
    const userId = 'test-user-' + Date.now();
    const vpnUuid = 'vpn-' + Date.now();

    const [id] = await db('users').insert({
      user_id: userId,
      email: 'test@example.com',
      username: 'testuser',
      vpn_uuid: vpnUuid,
      status: 1,
      traffic_limit: 10737418240, // 10GB
      traffic_used: 0,
      expire_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    console.log('Test user created successfully:');
    console.log('  User ID:', userId);
    console.log('  Email: test@example.com');
    console.log('  Username: testuser');
    console.log('  VPN UUID:', vpnUuid);

  } catch (error) {
    console.error('Failed to create test user:', error);
  } finally {
    await db.destroy();
  }
}

createTestUser();
