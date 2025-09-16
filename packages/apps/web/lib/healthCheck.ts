import { config } from '../../../core/infrastructure/Config';
import { RepositoryFactory } from '../../../infrastructure/RepositoryFactory';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  platform: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
      timestamp: string;
    };
  };
}

export class HealthCheckService {
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await this.runHealthChecks();
    
    // Determine overall status
    const hasFailures = Object.values(checks).some((check: any) => check.status === 'fail');
    const hasWarnings = Object.values(checks).some((check: any) => check.status === 'warn');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasFailures) {
      overallStatus = 'unhealthy';
    } else if (hasWarnings) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      version: config.get('version'),
      environment: config.get('env'),
      platform: config.get('platform.type'),
      checks
    };
  }

  async getReadinessStatus(): Promise<{ ready: boolean; checks: any }> {
    const checks = await this.runReadinessChecks();
    const ready = Object.values(checks).every((check: any) => check.status === 'pass');
    
    return { ready, checks };
  }

  private async runHealthChecks() {
    const checks: any = {};
    const timestamp = new Date().toISOString();

    // Database connectivity check
    try {
      const start = Date.now();
      const repository = RepositoryFactory.createAuto();
      
      // Try to perform a simple operation
      await repository.countByCategory();
      
      checks.database = {
        status: 'pass',
        message: 'Database connection successful',
        duration: Date.now() - start,
        timestamp
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: `Database connection failed: ${error instanceof Error ? error.message : error}`,
        timestamp
      };
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    checks.memory = {
      status: memUsagePercent > 90 ? 'fail' : memUsagePercent > 70 ? 'warn' : 'pass',
      message: `Memory usage: ${Math.round(memUsagePercent)}% (${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used)`,
      timestamp
    };

    // Event loop lag check
    const start = process.hrtime();
    await new Promise(resolve => setImmediate(resolve));
    const lag = process.hrtime(start);
    const lagMs = (lag[0] * 1000) + (lag[1] * 1e-6);
    
    checks.eventLoop = {
      status: lagMs > 100 ? 'fail' : lagMs > 50 ? 'warn' : 'pass',
      message: `Event loop lag: ${lagMs.toFixed(2)}ms`,
      duration: lagMs,
      timestamp
    };

    // Disk space check (if applicable)
    try {
      const fs = await import('fs/promises');
      const stats = await fs.statfs(process.cwd());
      const freeSpace = (stats.bavail * stats.bsize) / (stats.blocks * stats.bsize) * 100;
      
      checks.diskSpace = {
        status: freeSpace < 5 ? 'fail' : freeSpace < 10 ? 'warn' : 'pass',
        message: `Free disk space: ${freeSpace.toFixed(1)}%`,
        timestamp
      };
    } catch (error) {
      checks.diskSpace = {
        status: 'warn',
        message: 'Could not check disk space',
        timestamp
      };
    }

    // Configuration validation
    try {
      const appConfig = config.getConfig();
      checks.configuration = {
        status: 'pass',
        message: `Configuration loaded successfully (${appConfig.env})`,
        timestamp
      };
    } catch (error) {
      checks.configuration = {
        status: 'fail',
        message: `Configuration error: ${error instanceof Error ? error.message : error}`,
        timestamp
      };
    }

    return checks;
  }

  private async runReadinessChecks() {
    const checks: any = {};
    const timestamp = new Date().toISOString();

    // Database readiness
    try {
      const repository = RepositoryFactory.createAuto();
      await repository.countByCategory();
      
      checks.database = {
        status: 'pass',
        message: 'Database is ready',
        timestamp
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: 'Database is not ready',
        timestamp
      };
    }

    // Application initialization
    try {
      // Check if core services are initialized
      const appConfig = config.getConfig();
      
      checks.application = {
        status: 'pass',
        message: 'Application initialized',
        timestamp
      };
    } catch (error) {
      checks.application = {
        status: 'fail',
        message: 'Application not initialized',
        timestamp
      };
    }

    return checks;
  }

  async getLivenessStatus(): Promise<{ alive: boolean }> {
    // Simple liveness check - just verify the process is running
    return { alive: true };
  }

  // Metrics for Prometheus/monitoring
  getMetrics(): Record<string, number> {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime.getTime();

    return {
      'nodejs_heap_size_used_bytes': memUsage.heapUsed,
      'nodejs_heap_size_total_bytes': memUsage.heapTotal,
      'nodejs_external_memory_bytes': memUsage.external,
      'process_uptime_seconds': uptime / 1000,
      'process_start_time_seconds': this.startTime.getTime() / 1000,
    };
  }
}

// Global instance
export const healthCheck = new HealthCheckService();