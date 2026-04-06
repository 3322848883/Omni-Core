import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create payment_settings table
  await knex.schema.createTable('payment_settings', (table) => {
    table.string('provider', 50).primary().comment('支付提供商名称');
    table.json('config').notNullable().comment('支付配置JSON');
    table.timestamp('created_at').defaultTo(knex.fn.now()).comment('创建时间');
    table.timestamp('updated_at').defaultTo(knex.fn.now()).comment('更新时间');
  });

  // Create system_settings table if not exists
  const hasSystemSettings = await knex.schema.hasTable('system_settings');
  if (!hasSystemSettings) {
    await knex.schema.createTable('system_settings', (table) => {
      table.string('key', 100).primary().comment('设置键名');
      table.json('value').comment('设置值');
      table.timestamp('created_at').defaultTo(knex.fn.now()).comment('创建时间');
      table.timestamp('updated_at').defaultTo(knex.fn.now()).comment('更新时间');
    });
  }

  // Insert default payment settings
  await knex('payment_settings').insert([
    {
      provider: 'general',
      config: JSON.stringify({
        currency: 'CNY',
        exchangeRate: 1,
        minAmount: 1,
        maxAmount: 10000,
        defaultAmount: 10,
        enabledMethods: ['alipay', 'wechat'],
        autoComplete: true,
        expireMinutes: 30,
      }),
    },
    {
      provider: 'alipay',
      config: JSON.stringify({
        enabled: false,
        name: '支付宝',
        description: '使用支付宝进行支付',
        icon: 'alipay',
        appId: '',
        privateKey: '',
        publicKey: '',
        alipayPublicKey: '',
        gateway: 'https://openapi.alipay.com/gateway.do',
        notifyUrl: '',
        returnUrl: '',
        signType: 'RSA2',
        charset: 'utf-8',
      }),
    },
    {
      provider: 'wechat',
      config: JSON.stringify({
        enabled: false,
        name: '微信支付',
        description: '使用微信支付进行支付',
        icon: 'wechat',
        appId: '',
        mchId: '',
        apiKey: '',
        apiKeyV3: '',
        certPath: '',
        keyPath: '',
        notifyUrl: '',
        returnUrl: '',
        tradeType: 'NATIVE',
      }),
    },
    {
      provider: 'paypal',
      config: JSON.stringify({
        enabled: false,
        name: 'PayPal',
        description: '使用PayPal进行支付',
        icon: 'paypal',
        clientId: '',
        clientSecret: '',
        environment: 'sandbox',
        currency: 'USD',
        returnUrl: '',
        cancelUrl: '',
        webhookId: '',
      }),
    },
    {
      provider: 'stripe',
      config: JSON.stringify({
        enabled: false,
        name: 'Stripe',
        description: '使用Stripe进行支付',
        icon: 'credit-card',
        publishableKey: '',
        secretKey: '',
        webhookSecret: '',
        currency: 'USD',
        returnUrl: '',
      }),
    },
    {
      provider: 'wechatQr',
      config: JSON.stringify({
        enabled: false,
        name: '微信收款码',
        description: '使用微信收款码进行支付',
        icon: 'wechat-qr',
        payeeName: '',
        qrCodeUrl: '',
        remark: '',
      }),
    },
    {
      provider: 'alipayQr',
      config: JSON.stringify({
        enabled: false,
        name: '支付宝收款码',
        description: '使用支付宝收款码进行支付',
        icon: 'alipay-qr',
        payeeName: '',
        qrCodeUrl: '',
        remark: '',
      }),
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payment_settings');
}
