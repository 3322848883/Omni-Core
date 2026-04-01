import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('site_config', (table) => {
    table.bigIncrements('id').primary();
    table.string('config_key', 100).notNullable().unique();
    table.text('config_value').notNullable();
    table.string('config_type', 20).notNullable().defaultTo('string'); // string, number, boolean, json
    table.string('category', 50).notNullable().defaultTo('general'); // general, pricing, content, seo, social
    table.string('description', 255).nullable();
    table.boolean('is_public').notNullable().defaultTo(true); // 是否对前端公开
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('config_key', 'idx_site_config_key');
    table.index('category', 'idx_site_config_category');
    table.index('is_public', 'idx_site_config_is_public');
  });

  // Insert default configurations
  const defaultConfigs = [
    // 基础信息
    { config_key: 'site_name', config_value: 'Omni Core', config_type: 'string', category: 'general', description: '网站名称', is_public: true },
    { config_key: 'site_description', config_value: '安全、快速、匿名的网络体验', config_type: 'string', category: 'general', description: '网站描述', is_public: true },
    { config_key: 'site_logo', config_value: '/omnicore-liquid-logo.svg', config_type: 'string', category: 'general', description: '网站Logo', is_public: true },
    
    // SEO 配置
    { config_key: 'seo_title', config_value: 'Omni Core - 安全、快速、匿名的网络体验', config_type: 'string', category: 'seo', description: 'SEO标题', is_public: true },
    { config_key: 'seo_keywords', config_value: 'VPN, 虚拟专用网络, 网络安全, 隐私保护, Omni Core', config_type: 'string', category: 'seo', description: 'SEO关键词', is_public: true },
    { config_key: 'seo_description', config_value: 'Omni Core 提供军事级加密、全球节点覆盖、零日志政策的 VPN 服务', config_type: 'string', category: 'seo', description: 'SEO描述', is_public: true },
    
    // 定价配置
    { config_key: 'pricing_monthly', config_value: JSON.stringify({ price: 29, duration: 30, devices: 3, name: '月付套餐' }), config_type: 'json', category: 'pricing', description: '月付套餐配置', is_public: true },
    { config_key: 'pricing_quarterly', config_value: JSON.stringify({ price: 79, duration: 90, devices: 5, name: '季付套餐', discount: 8 }), config_type: 'json', category: 'pricing', description: '季付套餐配置', is_public: true },
    { config_key: 'pricing_yearly', config_value: JSON.stringify({ price: 269, duration: 365, devices: 10, name: '年付套餐', discount: 79 }), config_type: 'json', category: 'pricing', description: '年付套餐配置', is_public: true },
    { config_key: 'pricing_traffic', config_value: JSON.stringify({ price: 9.9, traffic: 100, name: '流量包' }), config_type: 'json', category: 'pricing', description: '流量包配置', is_public: true },
    
    // 内容配置
    { config_key: 'hero_title', config_value: '安全、快速、匿名的网络体验', config_type: 'string', category: 'content', description: '首页主标题', is_public: true },
    { config_key: 'hero_subtitle', config_value: 'Omni Core 提供军事级加密保护，让您自由访问全球网络', config_type: 'string', category: 'content', description: '首页副标题', is_public: true },
    { config_key: 'features_title', config_value: '为什么选择 Omni Core', config_type: 'string', category: 'content', description: '功能区域标题', is_public: true },
    { config_key: 'servers_title', config_value: '全球服务器节点', config_type: 'string', category: 'content', description: '服务器区域标题', is_public: true },
    { config_key: 'pricing_title', config_value: '选择适合您的方案', config_type: 'string', category: 'content', description: '定价区域标题', is_public: true },
    { config_key: 'cta_title', config_value: '准备好开始了吗？', config_type: 'string', category: 'content', description: 'CTA区域标题', is_public: true },
    { config_key: 'cta_subtitle', config_value: '立即注册，开启安全网络之旅', config_type: 'string', category: 'content', description: 'CTA区域副标题', is_public: true },
    
    // 统计配置
    { config_key: 'stats_countries', config_value: '50+', config_type: 'string', category: 'content', description: '覆盖国家数', is_public: true },
    { config_key: 'stats_servers', config_value: '200+', config_type: 'string', category: 'content', description: '服务器数量', is_public: true },
    { config_key: 'stats_uptime', config_value: '99.9%', config_type: 'string', category: 'content', description: '在线率', is_public: true },
    
    // 社交媒体
    { config_key: 'social_telegram', config_value: 'https://t.me/omnicore', config_type: 'string', category: 'social', description: 'Telegram链接', is_public: true },
    { config_key: 'social_twitter', config_value: '', config_type: 'string', category: 'social', description: 'Twitter链接', is_public: true },
    { config_key: 'social_github', config_value: '', config_type: 'string', category: 'social', description: 'GitHub链接', is_public: true },
    { config_key: 'contact_email', config_value: 'support@omnicore.vpn', config_type: 'string', category: 'social', description: '联系邮箱', is_public: true },
    
    // 功能开关
    { config_key: 'enable_registration', config_value: 'true', config_type: 'boolean', category: 'general', description: '是否开放注册', is_public: false },
    { config_key: 'enable_pricing', config_value: 'true', config_type: 'boolean', category: 'general', description: '是否显示定价', is_public: true },
    { config_key: 'copyright_year', config_value: '2026', config_type: 'string', category: 'general', description: '版权年份', is_public: true },
  ];

  await knex('site_config').insert(defaultConfigs);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('site_config');
}
