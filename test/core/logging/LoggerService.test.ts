/**
 * Logger Service Test Suite
 * @package HexPropertyBooking
 */

import { describe, it, expect, vi } from 'vitest';
import { LoggerService, LogLevel } from '@/core/logging/LoggerService';

describe('LoggerService', () => {
  let logger: LoggerService;

  beforeEach(() => {
    logger = LoggerService.getInstance();
    
    // Mock console methods to prevent actual logging during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Instance', () => {
    it('should return the same instance', () => {
      const instance1 = LoggerService.getInstance();
      const instance2 = LoggerService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Basic Logging', () => {
    it('should log messages at different levels', () => {
      const logSpy = vi.spyOn(logger as any, 'logger.log');

      logger.log(LogLevel.INFO, 'Test Info Message');
      logger.log(LogLevel.ERROR, 'Test Error Message');
      logger.log(LogLevel.DEBUG, 'Test Debug Message');

      expect(logSpy).toHaveBeenCalledTimes(3);
    });

    it('should include correlation ID', () => {
      const logSpy = vi.spyOn(logger as any, 'logger.log');

      logger.log(LogLevel.INFO, 'Test Message', { 
        userId: 'user-123' 
      });

      const logCall = logSpy.mock.calls[0][1];
      expect(logCall.correlationId).toBeTruthy();
      expect(logCall.userId).toBe('user-123');
    });
  });

  describe('Error Logging', () => {
    it('should log errors with stack trace', () => {
      const errorSpy = vi.spyOn(logger as any, 'logger.error');
      const testError = new Error('Test Error');

      logger.error('Error occurred', testError);

      const errorCall = errorSpy.mock.calls[0][0];
      expect(errorCall.error.name).toBe('Error');
      expect(errorCall.error.message).toBe('Test Error');
      expect(errorCall.error.stack).toBeTruthy();
    });
  });

  describe('Performance Tracing', () => {
    it('should trace synchronous method execution', () => {
      const performanceSpy = vi.spyOn(logger, 'performance');

      const result = logger.trace('Test Operation', () => {
        return 42;
      });

      expect(result).toBe(42);
      expect(performanceSpy).toHaveBeenCalled();
    });

    it('should trace asynchronous method execution', async () => {
      const performanceSpy = vi.spyOn(logger, 'performance');

      const result = await logger.asyncTrace('Async Operation', async () => {
        return 'Async Result';
      });

      expect(result).toBe('Async Result');
      expect(performanceSpy).toHaveBeenCalled();
    });

    it('should handle errors in traced methods', () => {
      const errorSpy = vi.spyOn(logger, 'error');

      expect(() => 
        logger.trace('Failing Operation', () => {
          throw new Error('Trace Failure');
        })
      ).toThrow('Trace Failure');

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Contextual Logging', () => {
    it('should support custom context', () => {
      const logSpy = vi.spyOn(logger as any, 'logger.log');

      logger.log(LogLevel.INFO, 'Contextual Message', {
        service: 'test-service',
        tags: {
          feature: 'logging',
          version: '1.0.0'
        }
      });

      const logCall = logSpy.mock.calls[0][1];
      expect(logCall.service).toBe('test-service');
      expect(logCall.tags).toEqual({
        feature: 'logging',
        version: '1.0.0'
      });
    });
  });
});
