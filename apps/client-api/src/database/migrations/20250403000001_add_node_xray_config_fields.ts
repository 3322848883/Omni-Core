import { Knex } from 'knex';

/**
 * 为 nodes 表添加 XRAY 协议配置字段
 * - security: 安全类型 (none, tls, xtls, reality)
 * - network: 传输协议 (tcp, ws, grpc, kcp)
 * - path: WebSocket 路径
 * - service_name: gRPC 服务名
 * - flow: XTLS 流控 (xtls-rprx-vision, xtls-rprx-direct)
 * - encryption: 加密方式 (用于 Shadowsocks)
 * - sni: TLS SNI
 * - allow_insecure: 是否允许不安全连接
 * - reality_public_key: REALITY 公钥
 * - reality_short_id: REALITY Short ID
 * - host_header: Host 请求头
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    // 安全类型
    table.string('security', 20).nullable().after('protocol').comment('安全类型: none, tls, xtls, reality');

    // 传输协议
    table.string('network', 20).nullable().after('security').comment('传输协议: tcp, ws, grpc, kcp');

    // WebSocket 路径
    table.string('path', 255).nullable().after('network').comment('WebSocket 路径');

    // gRPC 服务名
    table.string('service_name', 100).nullable().after('path').comment('gRPC 服务名');

    // XTLS 流控
    table.string('flow', 50).nullable().after('service_name').comment('XTLS 流控: xtls-rprx-vision');

    // 加密方式 (Shadowsocks)
    table.string('encryption', 50).nullable().after('flow').comment('加密方式: aes-256-gcm 等');

    // TLS SNI
    table.string('sni', 255).nullable().after('encryption').comment('TLS SNI');

    // 是否允许不安全连接
    table.boolean('allow_insecure').nullable().defaultTo(false).after('sni').comment('允许不安全连接');

    // REALITY 公钥
    table.text('reality_public_key').nullable().after('allow_insecure').comment('REALITY 公钥');

    // REALITY Short ID
    table.string('reality_short_id', 20).nullable().after('reality_public_key').comment('REALITY Short ID');

    // Host 请求头
    table.string('host_header', 255).nullable().after('reality_short_id').comment('Host 请求头');

    // 创建索引
    table.index('security', 'idx_nodes_security');
    table.index('network', 'idx_nodes_network');
  });

  console.log('Added XRAY config fields to nodes table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    // 删除索引
    table.dropIndex('security', 'idx_nodes_security');
    table.dropIndex('network', 'idx_nodes_network');

    // 删除字段
    table.dropColumn('host_header');
    table.dropColumn('reality_short_id');
    table.dropColumn('reality_public_key');
    table.dropColumn('allow_insecure');
    table.dropColumn('sni');
    table.dropColumn('encryption');
    table.dropColumn('flow');
    table.dropColumn('service_name');
    table.dropColumn('path');
    table.dropColumn('network');
    table.dropColumn('security');
  });

  console.log('Removed XRAY config fields from nodes table');
}
