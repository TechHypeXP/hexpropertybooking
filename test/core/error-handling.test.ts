import { describe, it, expect } from 'vitest';
import { DomainError } from '@/core/errors/DomainErrors';
import { ValidationError } from '@/core/validation/ValidationErrors';

describe('Error Handling', () => {
  describe('Domain Error', () => {
    it('should create a domain error with correct properties', () => {
      const error = new DomainError({
        code: 'PROPERTY_INVALID',
        message: 'Invalid property details',
        context: { propertyId: '123' }
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error.code).toBe('PROPERTY_INVALID');
      expect(error.message).toBe('Invalid property details');
      expect(error.context).toEqual({ propertyId: '123' });
    });

    it('should serialize error correctly', () => {
      const error = new DomainError({
        code: 'BOOKING_CONFLICT',
        message: 'Booking dates conflict',
        context: { startDate: '2024-01-01', endDate: '2024-01-05' }
      });

      const serialized = JSON.parse(JSON.stringify(error));
      expect(serialized).toEqual({
        code: 'BOOKING_CONFLICT',
        message: 'Booking dates conflict',
        context: { startDate: '2024-01-01', endDate: '2024-01-05' }
      });
    });
  });

  describe('Validation Error', () => {
    it('should create a validation error with multiple validation failures', () => {
      const error = new ValidationError({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: [
          { field: 'name', reason: 'Name is required' },
          { field: 'email', reason: 'Invalid email format' }
        ]
      });

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details).toHaveLength(2);
      expect(error.details[0].field).toBe('name');
      expect(error.details[1].reason).toBe('Invalid email format');
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle nested error contexts', () => {
      const createNestedError = () => {
        try {
          try {
            throw new DomainError({
              code: 'NESTED_ERROR',
              message: 'Nested error occurred',
              context: { level: 'deep' }
            });
          } catch (innerError) {
            throw new DomainError({
              code: 'OUTER_ERROR',
              message: 'Outer error',
              context: { 
                originalError: innerError instanceof DomainError 
                  ? innerError.toJSON() 
                  : null 
              }
            });
          }
        } catch (error) {
          expect(error).toBeInstanceOf(DomainError);
          expect((error as DomainError).code).toBe('OUTER_ERROR');
        }
      };

      createNestedError();
    });
  });
});
