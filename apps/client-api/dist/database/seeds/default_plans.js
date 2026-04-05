"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
async function seed(knex) {
    // 先删除现有数据
    await knex('subscription_plans').del();
    // 插入默认订阅套餐数据（带服务类型支持）
    await knex('subscription_plans').insert([
        // ========== 标准套餐组 ==========
        {
            plan_id: 'standard-lite',
            name: '标准-轻量版',
            description: '适合日常轻度使用，性价比高',
            price: 9.99,
            duration_days: 30,
            traffic_limit: 107374182400, // 100GB in bytes
            group_id: 'standard',
            service_types: JSON.stringify(['standard']),
            primary_service_type: 'standard',
            priority_boost: 0,
            guaranteed_bandwidth: 20,
            max_connections: 3,
            features: JSON.stringify([
                '100GB 流量',
                '30天有效期',
                '标准节点访问',
                '20Mbps保证带宽',
                '3设备同时在线',
                '基础客服支持'
            ]),
            is_popular: false,
            sort_order: 1,
            status: 1
        },
        {
            plan_id: 'standard-pro',
            name: '标准-专业版',
            description: '适合日常重度使用',
            price: 19.99,
            duration_days: 30,
            traffic_limit: 322122547200, // 300GB in bytes
            group_id: 'standard',
            service_types: JSON.stringify(['standard']),
            primary_service_type: 'standard',
            priority_boost: 1,
            guaranteed_bandwidth: 50,
            max_connections: 5,
            features: JSON.stringify([
                '300GB 流量',
                '30天有效期',
                '标准节点访问',
                '50Mbps保证带宽',
                '5设备同时在线',
                '优先客服支持',
                '流量包叠加'
            ]),
            is_popular: true,
            sort_order: 2,
            status: 1
        },
        // ========== 专线套餐组 ==========
        {
            plan_id: 'dedicated-entry',
            name: '专线-入门版',
            description: '专线入门体验，低延迟高稳定',
            price: 29.99,
            duration_days: 30,
            traffic_limit: 214748364800, // 200GB in bytes
            group_id: 'dedicated_line',
            service_types: JSON.stringify(['standard', 'dedicated_line']),
            primary_service_type: 'dedicated_line',
            priority_boost: 1,
            guaranteed_bandwidth: 50,
            max_connections: 3,
            features: JSON.stringify([
                '200GB 流量',
                '30天有效期',
                '标准+专线节点访问',
                '50Mbps保证带宽',
                '3设备同时在线',
                '低延迟线路'
            ]),
            is_popular: false,
            sort_order: 3,
            status: 1
        },
        {
            plan_id: 'dedicated-standard',
            name: '专线-标准版',
            description: '专线标准配置，游戏加速首选',
            price: 49.99,
            duration_days: 30,
            traffic_limit: 536870912000, // 500GB in bytes
            group_id: 'dedicated_line',
            service_types: JSON.stringify(['standard', 'dedicated_line']),
            primary_service_type: 'dedicated_line',
            priority_boost: 2,
            guaranteed_bandwidth: 100,
            max_connections: 5,
            features: JSON.stringify([
                '500GB 流量',
                '30天有效期',
                '标准+专线节点访问',
                '100Mbps保证带宽',
                '5设备同时在线',
                '优先客服支持',
                '游戏加速'
            ]),
            is_popular: true,
            sort_order: 4,
            status: 1
        },
        {
            plan_id: 'dedicated-premium',
            name: '专线-高级版',
            description: '专线高级配置，专业用户首选',
            price: 79.99,
            duration_days: 30,
            traffic_limit: 1099511627776, // 1TB in bytes
            group_id: 'dedicated_line',
            service_types: JSON.stringify(['standard', 'dedicated_line']),
            primary_service_type: 'dedicated_line',
            priority_boost: 3,
            guaranteed_bandwidth: 200,
            max_connections: 8,
            features: JSON.stringify([
                '1TB 流量',
                '30天有效期',
                '标准+专线节点访问',
                '200Mbps保证带宽',
                '8设备同时在线',
                '专属客服',
                '流量包叠加',
                'API接口'
            ]),
            is_popular: false,
            sort_order: 5,
            status: 1
        },
        {
            plan_id: 'dedicated-flagship',
            name: '专线-旗舰版',
            description: '专线旗舰配置，极致体验',
            price: 129.99,
            duration_days: 30,
            traffic_limit: 2199023255552, // 2TB in bytes
            group_id: 'dedicated_line',
            service_types: JSON.stringify(['standard', 'dedicated_line']),
            primary_service_type: 'dedicated_line',
            priority_boost: 4,
            guaranteed_bandwidth: 500,
            max_connections: 15,
            features: JSON.stringify([
                '2TB 流量',
                '30天有效期',
                '标准+专线节点访问',
                '500Mbps保证带宽',
                '15设备同时在线',
                '专属客服',
                '不限流量包',
                'API接口',
                '定制配置'
            ]),
            is_popular: false,
            sort_order: 6,
            status: 1
        },
        // ========== 独享套餐组 ==========
        {
            plan_id: 'exclusive-basic',
            name: '独享-基础版',
            description: '独享IP入门，独立资源',
            price: 99.99,
            duration_days: 30,
            traffic_limit: 536870912000, // 500GB in bytes
            group_id: 'exclusive',
            service_types: JSON.stringify(['standard', 'dedicated_line', 'exclusive']),
            primary_service_type: 'exclusive',
            priority_boost: 3,
            guaranteed_bandwidth: 100,
            max_connections: 3,
            features: JSON.stringify([
                '500GB 流量',
                '30天有效期',
                '全节点访问（含独享IP）',
                '100Mbps独享带宽',
                '3设备同时在线',
                '独立IP',
                'IP更换服务'
            ]),
            is_popular: false,
            sort_order: 7,
            status: 1
        },
        {
            plan_id: 'exclusive-business',
            name: '独享-商务版',
            description: '独享IP商务版，企业首选',
            price: 199.99,
            duration_days: 30,
            traffic_limit: 1099511627776, // 1TB in bytes
            group_id: 'exclusive',
            service_types: JSON.stringify(['standard', 'dedicated_line', 'exclusive']),
            primary_service_type: 'exclusive',
            priority_boost: 4,
            guaranteed_bandwidth: 300,
            max_connections: 8,
            features: JSON.stringify([
                '1TB 流量',
                '30天有效期',
                '全节点访问（含独享IP）',
                '300Mbps独享带宽',
                '8设备同时在线',
                '独立IP',
                'IP更换服务',
                '专属客服'
            ]),
            is_popular: true,
            sort_order: 8,
            status: 1
        },
        {
            plan_id: 'exclusive-enterprise',
            name: '独享-企业版',
            description: '独享IP企业版，最高规格',
            price: 499.99,
            duration_days: 30,
            traffic_limit: 5497558138880, // 5TB in bytes
            group_id: 'exclusive',
            service_types: JSON.stringify(['standard', 'dedicated_line', 'exclusive']),
            primary_service_type: 'exclusive',
            priority_boost: 5,
            guaranteed_bandwidth: 1000,
            max_connections: 20,
            features: JSON.stringify([
                '5TB 流量',
                '30天有效期',
                '全节点访问（含独享IP）',
                '1Gbps独享带宽',
                '20设备同时在线',
                '独立IP',
                'IP更换服务',
                '专属客服',
                'API接口',
                '定制配置',
                'SLA保障'
            ]),
            is_popular: false,
            sort_order: 9,
            status: 1
        }
    ]);
}
//# sourceMappingURL=default_plans.js.map