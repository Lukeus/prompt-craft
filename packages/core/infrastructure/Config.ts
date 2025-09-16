import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'sqlite' | 'azure-sql' | 'memory';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
  ssl?: boolean;
  connectionLimit?: number;
  timeout?: number;
  schema?: string;
  // Azure SQL specific
  server?: string;
  authentication?: 'default' | 'ActiveDirectoryPassword' | 'ActiveDirectoryIntegrated';
  // Advanced options
  poolMin?: number;
  poolMax?: number;
  acquireTimeoutMillis?: number;
  idleTimeoutMillis?: number;
}

export interface StorageConfig {
  type: 'filesystem' | 'database' | 'azure-blob' | 's3' | 'gcs';
  // Filesystem
  promptsDirectory?: string;
  // Cloud storage
  containerName?: string;
  bucketName?: string;
  region?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  timeout: number;
  bodyLimit: string;
}

export interface SecurityConfig {
  jwtSecret?: string;
  encryptionKey?: string;
  allowedOrigins: string[];
  trustProxy: boolean;
  helmet: {
    enabled: boolean;
    contentSecurityPolicy: boolean;
  };
  authentication: {
    enabled: boolean;
    provider: 'none' | 'azure-ad' | 'oauth2' | 'ldap';
    // Azure AD
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
    // OAuth2
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    // LDAP
    ldapUrl?: string;
    bindDN?: string;
    bindCredentials?: string;
    searchBase?: string;
  };
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'azure-insights' | 'elastic' | 'datadog';
  // File logging
  logFile?: string;
  maxFileSize?: string;
  maxFiles?: number;
  // Cloud logging
  connectionString?: string;
  apiKey?: string;
  index?: string;
}

export interface MetricsConfig {
  enabled: boolean;
  provider: 'none' | 'prometheus' | 'azure-insights' | 'datadog';
  endpoint?: string;
  apiKey?: string;
  labels?: Record<string, string>;
}

export interface AppConfig {
  env: 'development' | 'staging' | 'production';
  name: string;
  version: string;
  timezone: string;
  
  // Core configurations
  database: DatabaseConfig;
  storage: StorageConfig;
  server: ServerConfig;
  security: SecurityConfig;
  logging: LoggingConfig;
  metrics: MetricsConfig;
  
  // Feature flags
  features: {
    webInterface: boolean;
    mcpServer: boolean;
    apiEndpoints: boolean;
    authentication: boolean;
    monitoring: boolean;
    caching: boolean;
  };
  
  // Platform-specific
  platform: {
    type: 'vercel' | 'azure' | 'aws' | 'gcp' | 'kubernetes' | 'docker' | 'bare-metal';
    region?: string;
    resourceGroup?: string;
    subscriptionId?: string;
    cluster?: string;
    namespace?: string;
  };
}

export class ConfigManager {
  private config!: AppConfig; // Use definite assignment assertion
  private configFile?: string;

  constructor(configFile?: string) {
    this.configFile = configFile;
    this.loadConfig();
  }

  private loadConfig(): void {
    // Load environment variables first
    this.loadEnvironmentVariables();
    
    // Load base configuration
    const baseConfig = this.getBaseConfig();
    
    // Load environment-specific overrides
    const envConfig = this.loadEnvironmentConfig();
    
    // Load platform-specific overrides
    const platformConfig = this.loadPlatformConfig();
    
    // Load custom config file if provided
    const fileConfig = this.configFile ? this.loadConfigFile(this.configFile) : {};
    
    // Merge all configurations (later ones override earlier ones)
    this.config = this.deepMerge(baseConfig, envConfig, platformConfig, fileConfig);
    
    // Validate configuration
    this.validateConfig();
  }

  private loadEnvironmentVariables(): void {
    // Load from multiple possible .env files
    const envFiles = [
      '.env',
      `.env.${process.env.NODE_ENV || 'development'}`,
      '.env.local',
      `.env.${process.env.NODE_ENV || 'development'}.local`
    ];

    for (const envFile of envFiles) {
      const envPath = path.resolve(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
      }
    }
  }

  private getBaseConfig(): AppConfig {
    return {
      env: (process.env.NODE_ENV as any) || 'development',
      name: process.env.APP_NAME || 'prompt-craft',
      version: process.env.APP_VERSION || '1.0.0',
      timezone: process.env.TZ || 'UTC',
      
      database: {
        type: (process.env.DATABASE_TYPE as any) || 'postgresql',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME || 'prompts',
        username: process.env.DATABASE_USERNAME || process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        url: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true',
        connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
        timeout: parseInt(process.env.DATABASE_TIMEOUT || '30000'),
        schema: process.env.DATABASE_SCHEMA,
        poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2'),
        poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10'),
        acquireTimeoutMillis: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '60000'),
        idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
      },
      
      storage: {
        type: (process.env.STORAGE_TYPE as any) || 'filesystem',
        promptsDirectory: process.env.PROMPTS_DIRECTORY || path.join(process.cwd(), 'prompts'),
        containerName: process.env.STORAGE_CONTAINER,
        bucketName: process.env.STORAGE_BUCKET,
        region: process.env.STORAGE_REGION,
        endpoint: process.env.STORAGE_ENDPOINT,
        accessKey: process.env.STORAGE_ACCESS_KEY,
        secretKey: process.env.STORAGE_SECRET_KEY,
      },
      
      server: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '0.0.0.0',
        cors: {
          origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
          credentials: process.env.CORS_CREDENTIALS === 'true',
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
          max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        },
        timeout: parseInt(process.env.SERVER_TIMEOUT || '30000'),
        bodyLimit: process.env.BODY_LIMIT || '1mb',
      },
      
      security: {
        jwtSecret: process.env.JWT_SECRET,
        encryptionKey: process.env.ENCRYPTION_KEY,
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
        trustProxy: process.env.TRUST_PROXY === 'true',
        helmet: {
          enabled: process.env.HELMET_ENABLED !== 'false',
          contentSecurityPolicy: process.env.CSP_ENABLED !== 'false',
        },
        authentication: {
          enabled: process.env.AUTH_ENABLED === 'true',
          provider: (process.env.AUTH_PROVIDER as any) || 'none',
          tenantId: process.env.AZURE_TENANT_ID,
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET,
          authorizationUrl: process.env.OAUTH2_AUTHORIZATION_URL,
          tokenUrl: process.env.OAUTH2_TOKEN_URL,
          userInfoUrl: process.env.OAUTH2_USER_INFO_URL,
          ldapUrl: process.env.LDAP_URL,
          bindDN: process.env.LDAP_BIND_DN,
          bindCredentials: process.env.LDAP_BIND_CREDENTIALS,
          searchBase: process.env.LDAP_SEARCH_BASE,
        },
      },
      
      logging: {
        level: (process.env.LOG_LEVEL as any) || 'info',
        format: (process.env.LOG_FORMAT as any) || 'json',
        destination: (process.env.LOG_DESTINATION as any) || 'console',
        logFile: process.env.LOG_FILE,
        maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
        connectionString: process.env.LOG_CONNECTION_STRING,
        apiKey: process.env.LOG_API_KEY,
        index: process.env.LOG_INDEX,
      },
      
      metrics: {
        enabled: process.env.METRICS_ENABLED === 'true',
        provider: (process.env.METRICS_PROVIDER as any) || 'none',
        endpoint: process.env.METRICS_ENDPOINT,
        apiKey: process.env.METRICS_API_KEY,
        labels: process.env.METRICS_LABELS ? JSON.parse(process.env.METRICS_LABELS) : {},
      },
      
      features: {
        webInterface: process.env.FEATURE_WEB !== 'false',
        mcpServer: process.env.FEATURE_MCP !== 'false',
        apiEndpoints: process.env.FEATURE_API !== 'false',
        authentication: process.env.FEATURE_AUTH === 'true',
        monitoring: process.env.FEATURE_MONITORING === 'true',
        caching: process.env.FEATURE_CACHING === 'true',
      },
      
      platform: {
        type: (process.env.PLATFORM_TYPE as any) || 'docker',
        region: process.env.PLATFORM_REGION,
        resourceGroup: process.env.AZURE_RESOURCE_GROUP,
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
        cluster: process.env.KUBERNETES_CLUSTER,
        namespace: process.env.KUBERNETES_NAMESPACE || 'default',
      },
    };
  }

  private loadEnvironmentConfig(): Partial<AppConfig> {
    const configPath = path.resolve(process.cwd(), 'config', `${this.config?.env || 'development'}.json`);
    return this.loadJsonConfig(configPath);
  }

  private loadPlatformConfig(): Partial<AppConfig> {
    const platformType = process.env.PLATFORM_TYPE || 'docker';
    const configPath = path.resolve(process.cwd(), 'config', 'platforms', `${platformType}.json`);
    return this.loadJsonConfig(configPath);
  }

  private loadConfigFile(filePath: string): Partial<AppConfig> {
    return this.loadJsonConfig(path.resolve(filePath));
  }

  private loadJsonConfig(filePath: string): Partial<AppConfig> {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Failed to load config from ${filePath}:`, error);
    }
    return {};
  }

  private deepMerge(...objects: any[]): any {
    const result: Record<string, any> = {};
    for (const obj of objects) {
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              result[key] = this.deepMerge((result[key] as Record<string, any>) || {}, obj[key]);
            } else {
              result[key] = obj[key];
            }
          }
        }
      }
    }
    return result;
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate required fields based on configuration
    if (this.config.database.type === 'postgresql' && !this.config.database.url && !this.config.database.host) {
      errors.push('Database host or URL is required for PostgreSQL');
    }

    if (this.config.security.authentication.enabled) {
      if (this.config.security.authentication.provider === 'azure-ad' && !this.config.security.authentication.tenantId) {
        errors.push('Azure AD tenant ID is required when Azure AD authentication is enabled');
      }
    }

    if (this.config.storage.type === 'azure-blob' && !this.config.storage.containerName) {
      errors.push('Container name is required for Azure Blob storage');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config }; // Return a copy to prevent mutations
  }

  public get<T = any>(path: string): T {
    const keys = path.split('.');
    let current: any = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined as T;
      }
    }
    
    return current as T;
  }

  public isDevelopment(): boolean {
    return this.config.env === 'development';
  }

  public isProduction(): boolean {
    return this.config.env === 'production';
  }

  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }
}

// Global configuration instance
export const config = new ConfigManager();