import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('isps', (table) => {
    table.string('id', 36).primary();
    table.string('name').notNullable().unique();
    table.string('display_name').notNullable();
    table.string('country').notNullable();
    table.string('type').notNullable();
    table.integer('reputation').unsigned().defaultTo(80);
    table.text('features').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
  
  // 插入一些初始数据
  await knex('isps').insert([
    {
      id: '1',
      name: 'China Telecom',
      display_name: '中国电信',
      country: 'China',
      type: 'fiber',
      reputation: 85,
      features: JSON.stringify(['high_speed', 'stable']),
      is_active: true
    },
    {
      id: '2',
      name: 'China Mobile',
      display_name: '中国移动',
      country: 'China',
      type: 'mobile',
      reputation: 80,
      features: JSON.stringify(['wide_coverage', '4g_5g']),
      is_active: true
    },
    {
      id: '3',
      name: 'China Unicom',
      display_name: '中国联通',
      country: 'China',
      type: 'fiber',
      reputation: 82,
      features: JSON.stringify(['high_speed', 'stable']),
      is_active: true
    },
    {
      id: '4',
      name: 'AT&T',
      display_name: 'AT&T',
      country: 'USA',
      type: 'fiber',
      reputation: 78,
      features: JSON.stringify(['high_speed', 'wide_coverage']),
      is_active: true
    },
    {
      id: '5',
      name: 'Verizon',
      display_name: 'Verizon',
      country: 'USA',
      type: 'fiber',
      reputation: 83,
      features: JSON.stringify(['high_speed', 'stable']),
      is_active: true
    },
    {
      id: '6',
      name: 'T-Mobile',
      display_name: 'T-Mobile',
      country: 'USA',
      type: 'mobile',
      reputation: 75,
      features: JSON.stringify(['wide_coverage', '4g_5g']),
      is_active: true
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('isps');
}