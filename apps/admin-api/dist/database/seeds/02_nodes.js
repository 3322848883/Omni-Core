"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
async function seed(knex) {
    // Deletes ALL existing entries
    await knex('nodes').del();
    // Inserts seed entries
    await knex('nodes').insert([
        {
            code: 'US-LA-01',
            name: 'Los Angeles 01',
            region: 'US-West',
            country: 'United States',
            city: 'Los Angeles',
            latitude: 34.0522,
            longitude: -118.2437,
            host: 'us-la-01.fgvpn.com',
            port: 443,
            protocol: 'vless',
            status: 'online',
            health_score: 95,
            load_percent: 30,
            active_connections: 1500,
            max_connections: 10000,
            priority: 1,
            is_backup: false,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
        {
            code: 'US-NY-01',
            name: 'New York 01',
            region: 'US-East',
            country: 'United States',
            city: 'New York',
            latitude: 40.7128,
            longitude: -74.0060,
            host: 'us-ny-01.fgvpn.com',
            port: 443,
            protocol: 'vless',
            status: 'online',
            health_score: 92,
            load_percent: 45,
            active_connections: 2200,
            max_connections: 10000,
            priority: 1,
            is_backup: false,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
        {
            code: 'US-DAL-01',
            name: 'Dallas 01',
            region: 'US-Central',
            country: 'United States',
            city: 'Dallas',
            latitude: 32.7767,
            longitude: -96.7970,
            host: 'us-dal-01.fgvpn.com',
            port: 443,
            protocol: 'vless',
            status: 'online',
            health_score: 88,
            load_percent: 25,
            active_connections: 800,
            max_connections: 10000,
            priority: 2,
            is_backup: false,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
    ]);
}
//# sourceMappingURL=02_nodes.js.map