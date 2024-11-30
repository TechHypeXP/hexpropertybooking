/**
 * Advanced Logging Service for HexProperty Booking
 * @package HexPropertyBooking
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'winston';
import CloudWatchTransport from 'winston-cloudwatch';
import { performance } from 'perf_hooks';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  service?: string;
  traceId?: string;
  spanId?: string;
  tags?: Record<string, unknown>;
}

export class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;

  private constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      defaultMeta: { service: 'hex-property-booking' },
      transports: this.configureTransports()
    });
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private configureTransports(): winston.transport[] {
    const transports: winston.transport[] = [
      // Console transport for local development
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, ...metadata }) => {
            let msg = `${timestamp} [${level}]: ${message} `;
            const metaStr = Object.keys(metadata).length 
              ? JSON.stringify(metadata) 
              : '';
            return msg + metaStr;
          })
        )
      })
    ];

    // Add CloudWatch transport for production
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new CloudWatchTransport({
          logGroupName: 'hex-property-booking',
          logStreamName: `service-${process.pid}`,
          awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
          awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
          awsRegion: process.env.AWS_REGION || 'us-east-1'
        })
      );
    }

    return transports;
  }

  private createLogContext(
    context?: Partial<LogContext>
  ): LogContext {
    return {
      correlationId: context?.correlationId || uuidv4(),
      userId: context?.userId,
      service: context?.service || 'hex-property-booking',
      traceId: context?.traceId,
      spanId: context?.spanId,
      tags: context?.tags
    };
  }

  public log(
    level: LogLevel, 
    message: string, 
    context?: Partial<LogContext>,
    metadata?: Record<string, unknown>
  ) {
    const logContext = this.createLogContext(context);
    
    const logEntry = {
      message,
      ...logContext,
      ...metadata
    };

    this.logger.log(level, logEntry);
  }

  public error(
    message: string, 
    error?: Error, 
    context?: Partial<LogContext>
  ) {
    const logContext = this.createLogContext(context);
    
    this.logger.error({
      message,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      },
      ...logContext
    });
  }

  public performance(
    operationName: string, 
    startTime: number, 
    context?: Partial<LogContext>
  ) {
    const duration = performance.now() - startTime;
    const logContext = this.createLogContext(context);

    this.log(LogLevel.INFO, `Performance: ${operationName}`, {
      ...logContext,
      duration,
      durationUnit: 'ms'
    });
  }

  public trace<T>(
    operationName: string, 
    operation: () => T, 
    context?: Partial<LogContext>
  ): T {
    const startTime = performance.now();
    const logContext = this.createLogContext(context);

    try {
      const result = operation();
      this.performance(operationName, startTime, logContext);
      return result;
    } catch (error) {
      this.error(`Trace failed: ${operationName}`, error as Error, logContext);
      throw error;
    }
  }

  public async asyncTrace<T>(
    operationName: string, 
    operation: () => Promise<T>, 
    context?: Partial<LogContext>
  ): Promise<T> {
    const startTime = performance.now();
    const logContext = this.createLogContext(context);

    try {
      const result = await operation();
      this.performance(operationName, startTime, logContext);
      return result;
    } catch (error) {
      this.error(`Async Trace failed: ${operationName}`, error as Error, logContext);
      throw error;
    }
  }
}

// Decorator for method logging
export function LogMethod(
  level: LogLevel = LogLevel.INFO, 
  options: Partial<LogContext> = {}
) {
  return function (
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logger = LoggerService.getInstance();

    descriptor.value = function (...args: any[]) {
      const context = {
        ...options,
        tags: {
          class: target.constructor.name,
          method: propertyKey,
          arguments: args.length
        }
      };

      return logger.trace(
        `${target.constructor.name}.${propertyKey}`, 
        () => originalMethod.apply(this, args),
        context
      );
    };

    return descriptor;
  };
}

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  const logger = LoggerService.getInstance();
  logger.error('Unhandled Rejection', reason as Error);
});

process.on('uncaughtException', (error) => {
  const logger = LoggerService.getInstance();
  logger.error('Uncaught Exception', error);
  process.exit(1);
});
