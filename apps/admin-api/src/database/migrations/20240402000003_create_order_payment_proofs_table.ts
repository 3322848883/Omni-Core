import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create order_payment_proofs table - 存储付款凭证
  await knex.schema.createTable('order_payment_proofs', (table) => {
    table.bigIncrements('id').primary().comment('主键ID');
    table.bigInteger('order_id').unsigned().notNullable().comment('关联的订单ID');
    table.string('image_url', 500).notNullable().comment('付款凭证图片URL');
    table.text('remark').nullable().comment('用户提交的备注信息');
    table.string('status', 20).notNullable().defaultTo('pending').comment('审核状态: pending-待审核, approved-已通过, rejected-已拒绝');
    table.bigInteger('reviewed_by').unsigned().nullable().comment('审核人ID(管理员)');
    table.text('review_remark').nullable().comment('审核备注');
    table.timestamp('reviewed_at').nullable().comment('审核时间');
    table.timestamp('created_at').defaultTo(knex.fn.now()).comment('创建时间');

    // Indexes
    table.index('order_id', 'idx_order_payment_proofs_order_id');
    table.index('status', 'idx_order_payment_proofs_status');
    table.index('reviewed_by', 'idx_order_payment_proofs_reviewed_by');
    table.index('created_at', 'idx_order_payment_proofs_created_at');
    table.index(['order_id', 'status'], 'idx_order_payment_proofs_order_status');
  });

  await knex.raw('ALTER TABLE order_payment_proofs COMMENT = "订单付款凭证表"');

  // Add foreign key constraint (optional - depends on project preference)
  // 注意: 如果项目不使用外键约束,可以注释掉以下代码
  await knex.schema.alterTable('order_payment_proofs', (table) => {
    table.foreign('order_id', 'fk_order_payment_proofs_order_id')
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop foreign key first if exists
  await knex.schema.alterTable('order_payment_proofs', (table) => {
    table.dropForeign('order_id', 'fk_order_payment_proofs_order_id');
  });

  await knex.schema.dropTableIfExists('order_payment_proofs');
}
