"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('nodes', (table) => {
        table.bigIncrements('id').primary();
        table.string('code', 50).notNullable().unique();
        table.string('name', 100).notNullable();
        table.string('region', 50).notNullable();
        table.string('country', 50).notNullable();
        table.string('city', 50).notNullable();
        table.decimal('latitude', 10, 8).nullable();
        table.decimal('longitude', 11, 8).nullable();
        table.string('host', 255).notNullable();
        table.integer('port').unsigned().notNullable();
        table.enum('protocol', ['vmess', 'vless', 'trojan', 'shadowsocks']).notNullable().defaultTo('vmess');
        table.enum('status', ['active', 'inactive', 'maintenance']).notNullable().defaultTo('active');
        table.integer('health_score').unsigned().defaultTo(100);
        table.integer('load_percent').unsigned().defaultTo(0);
        table.integer('active_connections').unsigned().defaultTo(0);
        table.integer('max_connections').unsigned().defaultTo(1000);
        table.integer('priority').unsigned().defaultTo(0);
        table.boolean('is_backup').notNullable().defaultTo(false);
        table.text('config').nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        // 索引
        table.index('code', 'idx_nodes_code');
        table.index('region', 'idx_nodes_region');
        table.index('status', 'idx_nodes_status');
        table.index('priority', 'idx_nodes_priority');
        table.index(['status', 'priority'], 'idx_nodes_status_priority');
    });
    console.log('Created nodes table');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('nodes');
    console.log('Dropped nodes table');
}
//# sourceMappingURL=20240321000012_create_nodes_table.js.map