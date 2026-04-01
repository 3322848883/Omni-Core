import { db } from '../src/database';

async function checkDatabase() {
  try {
    // Check all tables
    const tables = await db.raw("SHOW TABLES");
    console.log('Existing tables:');
    tables[0].forEach((t: any) => {
      const tableName = Object.values(t)[0];
      console.log('  -', tableName);
    });

    // Check migrations
    const migrations = await db('knex_migrations').select('*');
    console.log('\nApplied migrations:', migrations.length);
    migrations.forEach((m: any) => console.log('  -', m.name));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

checkDatabase();
