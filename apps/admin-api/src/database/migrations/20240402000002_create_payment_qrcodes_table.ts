import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create payment_qrcodes table - 存储个人收款码信息
  await knex.schema.createTable('payment_qrcodes', (table) => {
    table.bigIncrements('id').primary().comment('主键ID');
    table.string('type', 50).notNullable().comment('收款码类型: wechat_personal-微信个人收款码, alipay_personal-支付宝个人收款码');
    table.string('name', 100).notNullable().comment('收款码名称/标识');
    table.string('image_url', 500).notNullable().comment('收款码图片URL');
    table.decimal('amount', 10, 2).nullable().comment('固定金额(可选), null表示任意金额');
    table.boolean('is_active').notNullable().defaultTo(true).comment('是否启用');
    table.integer('sort_order').unsigned().notNullable().defaultTo(0).comment('排序顺序,越小越靠前');
    table.bigInteger('usage_count').unsigned().notNullable().defaultTo(0).comment('使用次数统计');
    table.timestamp('created_at').defaultTo(knex.fn.now()).comment('创建时间');
    table.timestamp('updated_at').defaultTo(knex.fn.now()).comment('更新时间');

    // Indexes
    table.index('type', 'idx_payment_qrcodes_type');
    table.index('is_active', 'idx_payment_qrcodes_is_active');
    table.index('sort_order', 'idx_payment_qrcodes_sort_order');
    table.index(['type', 'is_active'], 'idx_payment_qrcodes_type_active');
  });

  await knex.raw('ALTER TABLE payment_qrcodes COMMENT = "个人收款码表"');

  // Insert default payment qrcodes data (optional seed data)
  await knex('payment_qrcodes').insert([
    {
      type: 'wechat_personal',
      name: '微信收款码-任意金额',
      image_url: '',
      amount: null,
      is_active: true,
      sort_order: 1,
      usage_count: 0,
    },
    {
      type: 'alipay_personal',
      name: '支付宝收款码-任意金额',
      image_url: '',
      amount: null,
      is_active: true,
      sort_order: 2,
      usage_count: 0,
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payment_qrcodes');
}
