/**
 * Performance Optimizer Test Suite
 * @package HexPropertyBooking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceOptimizer } from '@/core/performance/PerformanceOptimizer';
import { LoggerService } from '@/core/logging/LoggerService';

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  let loggerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    optimizer = PerformanceOptimizer.getInstance();
    loggerSpy = vi.spyOn(LoggerService.getInstance(), 'log');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Memoization', () => {
    it('should cache method results', async () => {
      const expensiveOperation = vi.fn((x: number) => x * 2);
      const memoizedFn = optimizer.memoize('test', expensiveOperation);

      const result1 = await memoizedFn(5);
      const result2 = await memoizedFn(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(expensiveOperation).toHaveBeenCalledTimes(1);
    });

    it('should support different cache configurations', async () => {
      const operation = vi.fn((x: number) => x * 2);
      const memoizedFn = optimizer.memoize('test', operation, { 
        ttl: 1,
        prefix: 'custom' 
      });

      await memoizedFn(5);
      await memoizedFn(5);

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Profiling', () => {
    it('should track method performance', () => {
      const operation = vi.fn((x: number) => x * 2);
      const profiledFn = optimizer.profile('test', operation);

      const result = profiledFn(5);

      expect(result).toBe(10);
      expect(loggerSpy).toHaveBeenCalled();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during profiling', () => {
      const operation = vi.fn(() => {
        throw new Error('Test Error');
      });

      expect(() => optimizer.profile('test', operation)())
        .toThrow('Test Error');
    });
  });

  describe('Circuit Breaker', () => {
    it('should block requests after failure threshold', () => {
      const failingOperation = vi.fn(() => {
        throw new Error('Failure');
      });

      const protectedFn = optimizer.createCircuitBreaker(failingOperation, {
        failureThreshold: 3,
        recoveryTime: 1000
      });

      expect(() => protectedFn()).toThrow('Failure');
      expect(() => protectedFn()).toThrow('Failure');
      expect(() => protectedFn()).toThrow('Failure');
      expect(() => protectedFn()).toThrow('Circuit is OPEN');
    });

    it('should recover after recovery time', async () => {
      const operation = vi.fn(() => 'Success');
      const failingOperation = vi.fn(() => {
        throw new Error('Failure');
      });

      const protectedFn = optimizer.createCircuitBreaker(failingOperation, {
        failureThreshold: 3,
        recoveryTime: 10
      });

      expect(() => protectedFn()).toThrow('Failure');
      expect(() => protectedFn()).toThrow('Failure');
      expect(() => protectedFn()).toThrow('Failure');
      expect(() => protectedFn()).toThrow('Circuit is OPEN');

      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 20));

      const recoveredFn = optimizer.createCircuitBreaker(operation, {
        failureThreshold: 3,
        recoveryTime: 10
      });

      expect(recoveredFn()).toBe('Success');
    });
  });

  describe('Cache Management', () => {
    it('should clear specific namespace cache', async () => {
      const operation = vi.fn((x: number) => x * 2);
      const memoizedFn = optimizer.memoize('testNamespace', operation);

      await memoizedFn(5);
      await optimizer.clearCache('testNamespace');

      await memoizedFn(5);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should clear entire cache', async () => {
      const operation1 = vi.fn((x: number) => x * 2);
      const operation2 = vi.fn((x: string) => x.toUpperCase());

      const memoizedFn1 = optimizer.memoize('namespace1', operation1);
      const memoizedFn2 = optimizer.memoize('namespace2', operation2);

      await memoizedFn1(5);
      await memoizedFn2('test');
      await optimizer.clearCache();

      await memoizedFn1(5);
      await memoizedFn2('test');

      expect(operation1).toHaveBeenCalledTimes(2);
      expect(operation2).toHaveBeenCalledTimes(2);
    });
  });
});
