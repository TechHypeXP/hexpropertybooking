/**
 * Validation Middleware Test Suite
 * @package HexPropertyBooking
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  ValidationMiddleware, 
  PropertySchema, 
  BuildingSchema,
  ValidateInput 
} from '@/core/validation/ValidationMiddleware';
import { ValidationError } from '@/core/errors/DomainErrors';

describe('ValidationMiddleware', () => {
  describe('Basic Validation', () => {
    it('should validate valid input successfully', () => {
      const validProperty = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buildingId: '223e4567-e89b-12d3-a456-426614174000',
        bedrooms: 3,
        floor: 2,
        unit: 'A101'
      };

      const result = ValidationMiddleware.validate(PropertySchema, validProperty);
      expect(result).toEqual(validProperty);
    });

    it('should throw ValidationError for invalid input', () => {
      const invalidProperty = {
        id: 'invalid-uuid',
        buildingId: '223e4567-e89b-12d3-a456-426614174000',
        bedrooms: 11,
        floor: -1,
        unit: ''
      };

      expect(() => ValidationMiddleware.validate(PropertySchema, invalidProperty))
        .toThrow(ValidationError);
    });
  });

  describe('Partial Validation', () => {
    it('should validate partial updates', () => {
      const partialUpdate = {
        bedrooms: 4,
        unit: 'B202'
      };

      const result = ValidationMiddleware.validatePartial(PropertySchema, partialUpdate);
      expect(result).toEqual(partialUpdate);
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple inputs', () => {
      const validProperties = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          buildingId: '223e4567-e89b-12d3-a456-426614174000',
          bedrooms: 3,
          floor: 2,
          unit: 'A101'
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          buildingId: '323e4567-e89b-12d3-a456-426614174000',
          bedrooms: 2,
          floor: 1,
          unit: 'B201'
        }
      ];

      const results = ValidationMiddleware.validateBatch(PropertySchema, validProperties);
      expect(results).toHaveLength(2);
    });
  });

  describe('Method Decorator Validation', () => {
    class PropertyService {
      @ValidateInput()
      createProperty(
        property: unknown, 
        buildingId: unknown
      ) {
        return { ...property, buildingId };
      }
    }

    it('should validate method arguments', () => {
      const service = new PropertyService();
      const validProperty = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        bedrooms: 3,
        floor: 2,
        unit: 'A101'
      };
      const validBuildingId = '223e4567-e89b-12d3-a456-426614174000';

      const result = service.createProperty(validProperty, validBuildingId);
      expect(result).toBeTruthy();
    });

    it('should throw error for invalid method arguments', () => {
      const service = new PropertyService();
      const invalidProperty = {
        id: 'invalid-uuid',
        bedrooms: 11,
        floor: -1,
        unit: ''
      };
      const invalidBuildingId = 'invalid-building-id';

      expect(() => service.createProperty(invalidProperty, invalidBuildingId))
        .toThrow(ValidationError);
    });
  });

  describe('Custom Schema Validation', () => {
    const CustomSchema = z.object({
      name: z.string().min(2).max(50),
      age: z.number().int().min(18).max(120),
      email: z.string().email()
    });

    it('should validate custom schema', () => {
      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john.doe@example.com'
      };

      const result = ValidationMiddleware.validate(CustomSchema, validData);
      expect(result).toEqual(validData);
    });
  });
});
