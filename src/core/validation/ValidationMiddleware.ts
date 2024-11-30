/**
 * Validation Middleware for Domain Integrity
 * @package HexPropertyBooking
 */

import { z } from 'zod';
import { ValidationError } from '../errors/DomainErrors';

export class ValidationMiddleware {
  /**
   * Validate input against a Zod schema
   * @param schema Zod schema for validation
   * @param data Input data to validate
   * @returns Validated and parsed data
   * @throws ValidationError if validation fails
   */
  static validate<T>(schema: z.ZodType<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));

        throw new ValidationError('Validation failed', {
          errors: formattedErrors
        });
      }
      throw error;
    }
  }

  /**
   * Partially validate input, allowing partial updates
   * @param schema Zod schema for validation
   * @param data Partial input data to validate
   * @returns Partially validated and parsed data
   * @throws ValidationError if validation fails
   */
  static validatePartial<T>(schema: z.ZodType<T>, data: Partial<T>): Partial<T> {
    try {
      return schema.partial().parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));

        throw new ValidationError('Partial validation failed', {
          errors: formattedErrors
        });
      }
      throw error;
    }
  }

  /**
   * Create a validation middleware for specific use cases
   * @param schema Zod schema for validation
   * @returns Middleware function
   */
  static createMiddleware<T>(schema: z.ZodType<T>) {
    return (data: unknown) => this.validate(schema, data);
  }

  /**
   * Validate and transform input
   * @param schema Zod schema with transformations
   * @param data Input data to validate and transform
   * @returns Transformed data
   * @throws ValidationError if validation fails
   */
  static validateAndTransform<T>(schema: z.ZodType<T>, data: unknown): T {
    try {
      return schema.transform(val => val).parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));

        throw new ValidationError('Validation and transformation failed', {
          errors: formattedErrors
        });
      }
      throw error;
    }
  }

  /**
   * Batch validation for multiple inputs
   * @param schema Zod schema for validation
   * @param dataArray Array of inputs to validate
   * @returns Array of validated data
   * @throws ValidationError if any validation fails
   */
  static validateBatch<T>(schema: z.ZodType<T>, dataArray: unknown[]): T[] {
    return dataArray.map(data => this.validate(schema, data));
  }
}

// Example Usage Schemas
export const PropertySchema = z.object({
  id: z.string().uuid(),
  buildingId: z.string().uuid(),
  bedrooms: z.number().int().min(1).max(10),
  floor: z.number().int().min(0).max(100),
  unit: z.string().min(1).max(20)
});

export const BuildingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  zoneId: z.string().uuid(),
  properties: z.array(PropertySchema).optional()
});

// Comprehensive Error Handling Decorator
export function ValidateInput() {
  return function (
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      try {
        // Validate each argument if it has a corresponding schema
        const schemas = Reflect.getMetadata('validation:schemas', target, propertyKey);
        
        if (schemas) {
          args.forEach((arg, index) => {
            if (schemas[index]) {
              ValidationMiddleware.validate(schemas[index], arg);
            }
          });
        }

        // Execute original method
        return originalMethod.apply(this, args);
      } catch (error) {
        // Log error, potentially send to monitoring system
        console.error('Validation Error:', error);
        throw error;
      }
    };

    return descriptor;
  };
}
