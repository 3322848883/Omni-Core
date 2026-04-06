import knex from 'knex';
import config from '../knexfile';

const db = knex(config.production);

async function migrate() {
  try {
    // Create payment_settings table
    const hasTable = await db.schema.hasTable('payment_settings');
    if (!hasTable) {
      await db.schema.createTable('payment_settings', (table) => {
        table.string('provider', 50).primary();
        table.json('config').notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('Created payment_settings table');
    }

    // Create system_settings table
    const hasSystemTable = await db.schema.hasTable('system_settings');
    if (!hasSystemTable) {
      await db.schema.createTable('system_settings', (table) => {
        table.string('key', 100).primary();
        table.json('value');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('Created system_settings table');
    }

    // Insert default payment settings
    const count = await db('payment_settings').count('* as count').first();
    if (count && parseInt(count.count as string) === 0) {
      await db('payment_settings').insert([
        {
          provider: 'general',
          config: JSON.stringify({
            currency: 'CNY', exchangeRate: 1, minAmount: 1, maxAmount: 10000,
            defaultAmount: 10, enabledMethods: ['alipay', 'wechat'],
            autoComplete: true, expireMinutes: 30,
          }),
        },
        {
          provider: 'alipay',
          config: JSON.stringify({
            enabled: false, name: '支付宝', description: '使用支付宝进行支付', icon: 'alipay',
            appId: '', privateKey: '', publicKey: '', alipayPublicKey: '',
            gateway: 'https://openapi.alipay.com/gateway.do', notifyUrl: '', returnUrl: '',
            signType: 'RSA2', charset: 'utf-8',
          }),
        },
        {
          provider: 'wechat',
          config: JSON.stringify({
            enabled: false, name: '微信支付', description: '使用微信支付进行支付', icon: 'wechat',
            appId: '', mchId: '', apiKey: '', apiKeyV3: '', certPath: '', keyPath: '',
            notifyUrl: '', returnUrl: '', tradeType: 'NATIVE',
          }),
        },
        {
          provider: 'paypal',
          config: JSON.stringify({
            enabled: false, name: 'PayPal', description: '使用PayPal进行支付', icon: 'paypal',
            clientId: '', clientSecret: '', environment: 'sandbox', currency: 'USD',
            returnUrl: '', cancelUrl: '', webhookId: '',
          }),
        },
        {
          provider: 'stripe',
          config: JSON.stringify({
            enabled: false, name: 'Stripe', description: '使用Stripe进行支付', icon: 'credit-card',
            publishableKey: '', secretKey: '', webhookSecret: '', currency: 'USD', returnUrl: '',
          }),
        },
      ]);
      console.log('Inserted default payment settings');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.destroy();
  }
}

migrate();
