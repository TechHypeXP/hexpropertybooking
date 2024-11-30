import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ValidationMiddleware } from '@/core/validation/ValidationMiddleware';
import { TestDataGenerator } from '../utils/test-helpers';

describe('Domain Validation Integration', () => {
  // Property Validation Schema
  const PropertySchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).max(100),
    type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'VACATION']),
    address: z.object({
      street: z.string().min(3),
      city: z.string().min(2),
      country: z.string().min(2),
      postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code')
    }),
    status: z.enum(['AVAILABLE', 'BOOKED', 'MAINTENANCE'])
  });

  // Booking Validation Schema
  const BookingSchema = z.object({
    id: z.string().uuid(),
    propertyId: z.string().uuid(),
    userId: z.string().uuid(),
    startDate: z.date(),
    endDate: z.date(),
    guests: z.number().int().min(1).max(10),
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED'])
  }).refine(
    (booking) => booking.endDate > booking.startDate, 
    { message: 'End date must be after start date' }
  );

  describe('Property Validation', () => {
    it('should validate a valid property', () => {
      const validProperty = TestDataGenerator.property();
      
      const result = ValidationMiddleware.validate(
        PropertySchema, 
        validProperty
      );

      expect(result).toBeTruthy();
    });

    it('should reject property with invalid name', () => {
      const invalidProperty = {
        ...TestDataGenerator.property(),
        name: 'a' // Too short
      };

      expect(() => 
        ValidationMiddleware.validate(PropertySchema, invalidProperty)
      ).toThrow('Name must be at least 3 characters');
    });
  });

  describe('Booking Validation', () => {
    it('should validate a valid booking', () => {
      const validBooking = {
        ...TestDataGenerator.booking(),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05')
      };

      const result = ValidationMiddleware.validate(
        BookingSchema, 
        validBooking
      );

      expect(result).toBeTruthy();
    });

    it('should reject booking with invalid date range', () => {
      const invalidBooking = {
        ...TestDataGenerator.booking(),
        startDate: new Date('2024-01-05'),
        endDate: new Date('2024-01-01')
      };

      expect(() => 
        ValidationMiddleware.validate(BookingSchema, invalidBooking)
      ).toThrow('End date must be after start date');
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should handle nested object validation', () => {
      const complexSchema = z.object({
        property: PropertySchema,
        booking: BookingSchema
      });

      const validComplexObject = {
        property: TestDataGenerator.property(),
        booking: {
          ...TestDataGenerator.booking(),
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05')
        }
      };

      const result = ValidationMiddleware.validate(
        complexSchema, 
        validComplexObject
      );

      expect(result).toBeTruthy();
    });
  });
});
