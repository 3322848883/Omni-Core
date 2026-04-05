import { Knex } from 'knex';
export declare const db: Knex<any, unknown[]>;
export declare function testConnection(): Promise<boolean>;
export declare function runMigrations(): Promise<void>;
export declare function runSeeds(): Promise<void>;
//# sourceMappingURL=index.d.ts.map