/**
 * Distributed Caching Service
 * @package HexPropertyBooking
 */

import Redis from 'ioredis';
import { createHash } from 'crypto';
import { LoggerService, LogLevel } from '@/core/logging/LoggerService';

export enum CacheStrategy {
  LRU = 'LRU',
  FIFO = 'FIFO',
  RANDOM = 'RANDOM'
}

export interface CacheOptions {
  ttl?: number;
  strategy?: CacheStrategy;
  prefix?: string;
}

export interface CacheProviderConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export class CacheService {
  private static instance: CacheService;
  private redisClient: Redis;
  private logger: LoggerService;

  private constructor(config?: CacheProviderConfig) {
    const {
      host = process.env.REDIS_HOST || 'localhost',
      port = parseInt(process.env.REDIS_PORT || '6379'),
      password = process.env.REDIS_PASSWORD,
      db = 0
    } = config || {};

    this.redisClient = new Redis({
      host,
      port,
      password,
      db,
      enableAutoPipelining: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.logger = LoggerService.getInstance();

    this.redisClient.on('error', (error) => {
      this.logger.log(LogLevel.ERROR, 'Redis Connection Error', { error });
    });
  }

  public static getInstance(config?: CacheProviderConfig): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  private generateCacheKey(
    namespace: string, 
    key: string, 
    prefix?: string
  ): string {
    const baseKey = `${namespace}:${key}`;
    const hashedKey = createHash('sha256')
      .update(baseKey)
      .digest('hex');
    
    return prefix 
      ? `${prefix}:${hashedKey}` 
      : hashedKey;
  }

  public async set<T>(
    namespace: string, 
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    const { 
      ttl = 3600,  // 1 hour default
      strategy = CacheStrategy.LRU,
      prefix 
    } = options;

    const cacheKey = this.generateCacheKey(namespace, key, prefix);
    
    try {
      await this.redisClient.set(
        cacheKey, 
        JSON.stringify(value), 
        'EX', 
        ttl
      );

      this.logger.log(LogLevel.DEBUG, 'Cache Set', {
        namespace,
        key: cacheKey,
        ttl,
        strategy
      });
    } catch (error) {
      this.logger.log(LogLevel.ERROR, 'Cache Set Failed', {
        namespace,
        key: cacheKey,
        error
      });
      throw error;
    }
  }

  public async get<T>(
    namespace: string, 
    key: string, 
    prefix?: string
  ): Promise<T | null> {
    const cacheKey = this.generateCacheKey(namespace, key, prefix);

    try {
      const cachedValue = await this.redisClient.get(cacheKey);
      
      if (cachedValue) {
        this.logger.log(LogLevel.DEBUG, 'Cache Hit', {
          namespace,
          key: cacheKey
        });
        return JSON.parse(cachedValue) as T;
      }

      this.logger.log(LogLevel.DEBUG, 'Cache Miss', {
        namespace,
        key: cacheKey
      });

      return null;
    } catch (error) {
      this.logger.log(LogLevel.ERROR, 'Cache Get Failed', {
        namespace,
        key: cacheKey,
        error
      });
      throw error;
    }
  }

  public async delete(
    namespace: string, 
    key: string, 
    prefix?: string
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(namespace, key, prefix);

    try {
      await this.redisClient.del(cacheKey);
      
      this.logger.log(LogLevel.DEBUG, 'Cache Delete', {
        namespace,
        key: cacheKey
      });
    } catch (error) {
      this.logger.log(LogLevel.ERROR, 'Cache Delete Failed', {
        namespace,
        key: cacheKey,
        error
      });
      throw error;
    }
  }

  public async clearNamespace(
    namespace: string, 
    prefix?: string
  ): Promise<void> {
    try {
      const pattern = prefix 
        ? `${prefix}:*${namespace}*` 
        : `*${namespace}*`;
      
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }

      this.logger.log(LogLevel.DEBUG, 'Namespace Cleared', {
        namespace,
        keysDeleted: keys.length
      });
    } catch (error) {
      this.logger.log(LogLevel.ERROR, 'Namespace Clearing Failed', {
        namespace,
        error
      });
      throw error;
    }
  }

  public async incrementCounter(
    namespace: string, 
    key: string, 
    increment = 1
  ): Promise<number> {
    const cacheKey = this.generateCacheKey(namespace, key);

    try {
      const result = await this.redisClient.incrby(cacheKey, increment);
      
      this.logger.log(LogLevel.DEBUG, 'Counter Incremented', {
        namespace,
        key: cacheKey,
        increment,
        newValue: result
      });

      return result;
    } catch (error) {
      this.logger.log(LogLevel.ERROR, 'Counter Increment Failed', {
        namespace,
        key: cacheKey,
        error
      });
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.redisClient.quit();
  }
}

// Decorator for method caching
export function Cacheable(
  options: CacheOptions = {}
) {
  return function (
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheService = CacheService.getInstance();

    descriptor.value = async function (...args: any[]) {
      const namespace = `${target.constructor.name}.${propertyKey}`;
      const cacheKey = args.map(arg => JSON.stringify(arg)).join(':');

      try {
        const cachedResult = await cacheService.get(namespace, cacheKey);
        
        if (cachedResult !== null) {
          return cachedResult;
        }

        const result = await originalMethod.apply(this, args);
        
        await cacheService.set(namespace, cacheKey, result, options);
        
        return result;
      } catch (error) {
        // Fallback to original method if cache fails
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}
