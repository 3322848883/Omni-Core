import { Knex } from 'knex';

/**
 * 创建 ISP 信息表
 * 套餐服务体系升级 - 阶段一：基础数据层
 * 
 * 创建表:
 * - isps: ISP信息表，存储运营商信息
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('isps', (table) => {
    table.string('id', 50).primary().comment('ISP ID');
    table.string('name', 100).notNullable().comment('ISP名称');
    table.string('display_name', 100).notNullable().comment('显示名称');
    table.string('country', 10).notNullable().comment('国家代码');
    table.string('type', 20).notNullable().comment('类型: starlink/cable/fiber/mobile');
    table.integer('reputation').unsigned().notNullable().defaultTo(80).comment('声誉评分');
    table.json('features').nullable().comment('特性标签');
    table.boolean('is_active').notNullable().defaultTo(true).comment('是否激活');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // 索引
    table.index('country', 'idx_isps_country');
    table.index('type', 'idx_isps_type');
    table.index('is_active', 'idx_isps_is_active');
    table.index('reputation', 'idx_isps_reputation');
    table.index(['country', 'is_active'], 'idx_isps_country_active');
  });

  console.log('Created isps table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('isps');
  console.log('Dropped isps table');
}
