import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if orders table exists
  const hasOrdersTable = await knex.schema.hasTable('orders');
  if (!hasOrdersTable) {
    throw new Error('orders table does not exist');
  }

  // Check existing columns in orders table
  const hasPaymentMethod = await knex.schema.hasColumn('orders', 'payment_method');
  const hasPaymentQrcodeId = await knex.schema.hasColumn('orders', 'payment_qrcode_id');
  const hasPaymentProofId = await knex.schema.hasColumn('orders', 'payment_proof_id');

  await knex.schema.alterTable('orders', (table) => {
    // Modify payment_method column to support personal qrcode payment types
    // 支持: alipay, wechat, paypal, stripe, alipay_personal, wechat_personal, etc.
    if (hasPaymentMethod) {
      // 如果已存在,可能需要修改长度以容纳更长的支付方式名称
      // 注意: Knex 不直接支持修改列长度,如需修改需使用 raw SQL
      // 这里假设现有长度足够,或已在创建时预留足够长度
    }

    // Add payment_qrcode_id field - 关联使用的个人收款码
    if (!hasPaymentQrcodeId) {
      table.bigInteger('payment_qrcode_id').unsigned().nullable()
        .comment('使用的个人收款码ID,关联 payment_qrcodes 表');
      table.index('payment_qrcode_id', 'idx_orders_payment_qrcode_id');
    }

    // Add payment_proof_id field - 关联用户提交的付款凭证
    if (!hasPaymentProofId) {
      table.bigInteger('payment_proof_id').unsigned().nullable()
        .comment('用户提交的付款凭证ID,关联 order_payment_proofs 表');
      table.index('payment_proof_id', 'idx_orders_payment_proof_id');
    }
  });

  // Add composite index for querying orders by payment method and qrcode
  await knex.schema.alterTable('orders', (table) => {
    table.index(['payment_method', 'payment_qrcode_id'], 'idx_orders_payment_method_qrcode');
    table.index(['status', 'payment_method'], 'idx_orders_status_payment_method');
  });

  // Add foreign key constraints (optional)
  // 注意: 如果项目不使用外键约束,可以注释掉以下代码
  await knex.schema.alterTable('orders', (table) => {
    if (!hasPaymentQrcodeId) {
      table.foreign('payment_qrcode_id', 'fk_orders_payment_qrcode_id')
        .references('id')
        .inTable('payment_qrcodes')
        .onDelete('SET NULL');
    }
    if (!hasPaymentProofId) {
      table.foreign('payment_proof_id', 'fk_orders_payment_proof_id')
        .references('id')
        .inTable('order_payment_proofs')
        .onDelete('SET NULL');
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  // Check if orders table exists
  const hasOrdersTable = await knex.schema.hasTable('orders');
  if (!hasOrdersTable) {
    return;
  }

  // Drop foreign keys first
  const hasPaymentQrcodeId = await knex.schema.hasColumn('orders', 'payment_qrcode_id');
  const hasPaymentProofId = await knex.schema.hasColumn('orders', 'payment_proof_id');

  await knex.schema.alterTable('orders', (table) => {
    // Drop composite indexes
    table.dropIndex(['payment_method', 'payment_qrcode_id'], 'idx_orders_payment_method_qrcode');
    table.dropIndex(['status', 'payment_method'], 'idx_orders_status_payment_method');

    // Drop foreign keys and columns
    if (hasPaymentQrcodeId) {
      table.dropForeign('payment_qrcode_id', 'fk_orders_payment_qrcode_id');
      table.dropColumn('payment_qrcode_id');
    }
    if (hasPaymentProofId) {
      table.dropForeign('payment_proof_id', 'fk_orders_payment_proof_id');
      table.dropColumn('payment_proof_id');
    }
  });
}
