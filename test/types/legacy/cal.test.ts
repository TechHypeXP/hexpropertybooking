import { describe, it, expect } from 'vitest';
import { CalDateRangeSchema, CalAvailabilitySchema } from '../../../src/types/legacy/cal';

describe('CAL System Types', () => {
  describe('CalDateRange', () => {
    it('should validate valid date range', () => {
      const validRange = {
        date_start: '2024-01-01',
        date_end: '2024-01-05',
        is_available: true
      };
      expect(() => CalDateRangeSchema.parse(validRange)).not.toThrow();
    });

    it('should reject invalid date format', () => {
      const invalidRange = {
        date_start: 'invalid',
        date_end: '2024-01-05',
        is_available: true
      };
      expect(() => CalDateRangeSchema.parse(invalidRange)).toThrow();
    });
  });

  describe('CalAvailability', () => {
    it('should validate valid availability', () => {
      const validAvailability = {
        property_id: 'prop1',
        availability: 5,
        restrictions: [
          { type: 'MIN_STAY', value: '3', message: 'Minimum 3 nights' }
        ]
      };
      expect(() => CalAvailabilitySchema.parse(validAvailability)).not.toThrow();
    });

    it('should allow missing restrictions', () => {
      const noRestrictions = {
        property_id: 'prop1',
        availability: 5
      };
      expect(() => CalAvailabilitySchema.parse(noRestrictions)).not.toThrow();
    });
  });
});
