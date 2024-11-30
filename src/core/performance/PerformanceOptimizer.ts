/**
 * Performance Optimization Framework
 * @package HexPropertyBooking
 */

import { performance } from 'perf_hooks';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { LoggerService, LogLevel } from '../logging/LoggerService';

export interface CacheConfig {
  ttl?: number;
  enabled?: boolean;
  prefix?: string;
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsed: number;
  cacheHit: boolean;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private redis: Redis;
  private logger: LoggerService;

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      enableAutoPipelining: true
    });
    this.logger = LoggerService.getInstance();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private generateCacheKey(
    namespace: string, 
    args: unknown[]
  ): string {
    const argsString = JSON.stringify(args);
    const hash = createHash('sha256')
      .update(`${namespace}:${argsString}`)
      .digest('hex');
    return `perf:cache:${namespace}:${hash}`;
  }

  public memoize<T extends (...args: any[]) => any>(
    namespace: string,
    fn: T,
    config: CacheConfig = {}
  ): T {
    const {
      ttl = 300,  // 5 minutes default
      enabled = true,
      prefix = 'default'
    } = config;

    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (!enabled) {
        return fn(...args);
      }

      const cacheKey = this.generateCacheKey(`${prefix}:${namespace}`, args);
      const logger = this.logger;

      try {
        const startTime = performance.now();
        const cachedResult = await this.redis.get(cacheKey);

        if (cachedResult) {
          const result = JSON.parse(cachedResult);
          const endTime = performance.now();

          logger.log(LogLevel.DEBUG, 'Cache Hit', {
            namespace,
            cacheKey,
            executionTime: endTime - startTime
          });

          return result;
        }

        const result = await fn(...args);
        await this.redis.setex(
          cacheKey, 
          ttl, 
          JSON.stringify(result)
        );

        const endTime = performance.now();
        logger.log(LogLevel.DEBUG, 'Cache Miss', {
          namespace,
          cacheKey,
          executionTime: endTime - startTime
        });

        return result;
      } catch (error) {
        logger.error('Memoization Error', error as Error, { namespace, cacheKey });
        return fn(...args);
      }
    }) as T;
  }

  public profile<T extends (...args: any[]) => any>(
    namespace: string,
    fn: T
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed;

      try {
        const result = fn(...args);

        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed;

        const metrics: PerformanceMetrics = {
          executionTime: endTime - startTime,
          memoryUsed: endMemory - startMemory,
          cacheHit: false
        };

        this.logger.log(LogLevel.INFO, 'Performance Profile', {
          namespace,
          metrics
        });

        return result;
      } catch (error) {
        this.logger.error('Profiling Error', error as Error, { namespace });
        throw error;
      }
    }) as T;
  }

  public async clearCache(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        const keys = await this.redis.keys(`perf:cache:${namespace}:*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.redis.flushdb();
      }
    } catch (error) {
      this.logger.error('Cache Clearing Error', error as Error);
    }
  }

  public createCircuitBreaker<T extends (...args: any[]) => any>(
    fn: T, 
    options = { 
      failureThreshold: 3, 
      recoveryTime: 30000 
    }
  ): T {
    let failures = 0;
    let lastFailureTime = 0;
    let isOpen = false;

    return ((...args: Parameters<T>): ReturnType<T> => {
      const now = Date.now();

      if (isOpen) {
        if (now - lastFailureTime > options.recoveryTime) {
          isOpen = false;
          failures = 0;
        } else {
          throw new Error('Circuit is OPEN. Request blocked.');
        }
      }

      try {
        const result = fn(...args);
        failures = 0;
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        if (failures >= options.failureThreshold) {
          isOpen = true;
          this.logger.error('Circuit Breaker Triggered', error as Error);
        }

        throw error;
      }
    }) as T;
  }
}

// Performance Decorator
export function Memoize(
  config: CacheConfig = {}
) {
  return function (
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const optimizer = PerformanceOptimizer.getInstance();

    descriptor.value = optimizer.memoize(
      `${target.constructor.name}.${propertyKey}`, 
      originalMethod.bind(target),
      config
    );

    return descriptor;
  };
}

export function Profile() {
  return function (
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const optimizer = PerformanceOptimizer.getInstance();

    descriptor.value = optimizer.profile(
      `${target.constructor.name}.${propertyKey}`, 
      originalMethod.bind(target)
    );

    return descriptor;
  };
}
