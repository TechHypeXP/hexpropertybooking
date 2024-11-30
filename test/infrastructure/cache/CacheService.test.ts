/**
 * Cache Service Test Suite
 * @package HexPropertyBooking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService, CacheStrategy } from '@/infrastructure/cache/CacheService';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = CacheService.getInstance();
  });

  afterEach(async () => {
    // Clear all cache after each test
    await cacheService.clearNamespace('test');
  });

  describe('Singleton Instance', () => {
    it('should return the same instance', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Basic Caching Operations', () => {
    it('should set and get cache value', async () => {
      const namespace = 'test';
      const key = 'basic-key';
      const value = { name: 'Test Property' };

      await cacheService.set(namespace, key, value);
      const cachedValue = await cacheService.get(namespace, key);

      expect(cachedValue).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const cachedValue = await cacheService.get('test', 'non-existent');
      
      expect(cachedValue).toBeNull();
    });

    it('should delete cache value', async () => {
      const namespace = 'test';
      const key = 'delete-key';
      const value = { name: 'Delete Property' };

      await cacheService.set(namespace, key, value);
      await cacheService.delete(namespace, key);

      const cachedValue = await cacheService.get(namespace, key);
      
      expect(cachedValue).toBeNull();
    });
  });

  describe('Cache Configuration', () => {
    it('should support custom TTL', async () => {
      const namespace = 'test';
      const key = 'ttl-key';
      const value = { name: 'TTL Property' };

      await cacheService.set(namespace, key, value, { 
        ttl: 1,  // 1 second
        strategy: CacheStrategy.LRU 
      });

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1500));

      const cachedValue = await cacheService.get(namespace, key);
      
      expect(cachedValue).toBeNull();
    });

    it('should support namespace clearing', async () => {
      const namespace = 'test';
      
      await cacheService.set(namespace, 'key1', { name: 'Property 1' });
      await cacheService.set(namespace, 'key2', { name: 'Property 2' });

      await cacheService.clearNamespace(namespace);

      const cachedValue1 = await cacheService.get(namespace, 'key1');
      const cachedValue2 = await cacheService.get(namespace, 'key2');
      
      expect(cachedValue1).toBeNull();
      expect(cachedValue2).toBeNull();
    });
  });

  describe('Counter Operations', () => {
    it('should increment counter', async () => {
      const namespace = 'test';
      const key = 'counter-key';

      const initialValue = await cacheService.incrementCounter(namespace, key);
      const subsequentValue = await cacheService.incrementCounter(namespace, key);

      expect(initialValue).toBe(1);
      expect(subsequentValue).toBe(2);
    });

    it('should support custom increment', async () => {
      const namespace = 'test';
      const key = 'custom-counter';

      const value = await cacheService.incrementCounter(namespace, key, 5);
      
      expect(value).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle cache set errors', async () => {
      const mockSet = vi.spyOn(cacheService as any, 'redisClient.set')
        .mockRejectedValue(new Error('Redis Error'));

      await expect(
        cacheService.set('test', 'error-key', { name: 'Error Property' })
      ).rejects.toThrow('Redis Error');

      mockSet.mockRestore();
    });

    it('should handle cache get errors', async () => {
      const mockGet = vi.spyOn(cacheService as any, 'redisClient.get')
        .mockRejectedValue(new Error('Redis Error'));

      await expect(
        cacheService.get('test', 'error-key')
      ).rejects.toThrow('Redis Error');

      mockGet.mockRestore();
    });
  });
});
