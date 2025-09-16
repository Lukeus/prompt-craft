import { Pool } from '@neondatabase/serverless';
declare class DatabaseConnection {
    private static instance;
    private pool;
    private db;
    private constructor();
    static getInstance(): DatabaseConnection;
    getDb(): import("drizzle-orm/neon-serverless").NeonDatabase<Record<string, unknown>> & {
        $client: Pool;
    };
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
}
export declare const getDatabase: () => import("drizzle-orm/neon-serverless").NeonDatabase<Record<string, unknown>> & {
    $client: Pool;
};
export declare const testDatabaseConnection: () => Promise<boolean>;
export declare const closeDatabaseConnection: () => Promise<void>;
export declare const getDatabaseConnection: () => DatabaseConnection;
export {};
//# sourceMappingURL=connection.d.ts.map