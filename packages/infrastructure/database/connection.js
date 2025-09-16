"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConnection = exports.closeDatabaseConnection = exports.testDatabaseConnection = exports.getDatabase = void 0;
const neon_serverless_1 = require("drizzle-orm/neon-serverless");
const serverless_1 = require("@neondatabase/serverless");
const schema = __importStar(require("./schema"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Configure Neon for better performance in serverless environments
serverless_1.neonConfig.fetchConnectionCache = true;
class DatabaseConnection {
    constructor() {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is required');
        }
        this.pool = new serverless_1.Pool({
            connectionString: databaseUrl,
            max: 20, // Maximum number of connections in the pool
            idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
            connectionTimeoutMillis: 2000, // Timeout for new connections
        });
        this.db = (0, neon_serverless_1.drizzle)(this.pool, { schema, logger: process.env.NODE_ENV === 'development' });
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    getDb() {
        return this.db;
    }
    async testConnection() {
        try {
            const result = await this.db.execute('SELECT 1 as test');
            return Array.isArray(result) && result.length > 0;
        }
        catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
    async close() {
        await this.pool.end();
    }
}
// Export singleton instance functions
const getDatabase = () => DatabaseConnection.getInstance().getDb();
exports.getDatabase = getDatabase;
const testDatabaseConnection = () => DatabaseConnection.getInstance().testConnection();
exports.testDatabaseConnection = testDatabaseConnection;
const closeDatabaseConnection = () => DatabaseConnection.getInstance().close();
exports.closeDatabaseConnection = closeDatabaseConnection;
// Export the database connection for migration scripts
const getDatabaseConnection = () => DatabaseConnection.getInstance();
exports.getDatabaseConnection = getDatabaseConnection;
//# sourceMappingURL=connection.js.map