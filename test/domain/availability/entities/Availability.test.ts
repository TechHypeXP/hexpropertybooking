import { describe, it, expect, beforeEach } from 'vitest';
import { Availability } from '@/domain/availability/entities/Availability';
import { DateRange, BookingRestriction } from '@/types/domain/availability';

describe('Availability Entity', () => {
  let validDateRange: DateRange;
  let validRestriction: BookingRestriction;

  beforeEach(() => {
    validDateRange = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05')
    };

    validRestriction = {
      type: 'MIN_STAY',
      value: '3',
      description: 'Minimum 3 nights'
    };
  });

  describe('create', () => {
    it('should create valid availability', () => {
      const availability = Availability.create('prop1', validDateRange, 5);
      expect(availability.getPropertyId()).toBe('prop1');
      expect(availability.getDateRange()).toEqual(validDateRange);
      expect(availability.getStatus().availableUnits).toBe(5);
    });

    it('should throw error for invalid date range', () => {
      const invalidRange = {
        startDate: new Date('2024-01-05'),
        endDate: new Date('2024-01-01')
      };
      
      expect(() => {
        Availability.create('prop1', invalidRange, 5);
      }).toThrow();
    });

    it('should throw error for negative units', () => {
      expect(() => {
        Availability.create('prop1', validDateRange, -1);
      }).toThrow('Available units cannot be negative');
    });

    it('should create with empty restrictions', () => {
      const availability = Availability.create('prop1', validDateRange, 5);
      expect(availability.getRestrictions()).toHaveLength(0);
    });
  });

  describe('getStatus', () => {
    it('should return valid status', () => {
      const availability = Availability.create('prop1', validDateRange, 5, [validRestriction]);
      const status = availability.getStatus();
      
      expect(status).toEqual({
        isAvailable: true,
        availableUnits: 5,
        restrictions: [validRestriction]
      });
    });

    it('should reflect availability based on units', () => {
      const availability = Availability.create('prop1', validDateRange, 0);
      const status = availability.getStatus();
      
      expect(status.isAvailable).toBe(false);
    });
  });

  describe('updateAvailableUnits', () => {
    it('should update units', () => {
      const availability = Availability.create('prop1', validDateRange, 5);
      availability.updateAvailableUnits(3);
      expect(availability.getStatus().availableUnits).toBe(3);
    });

    it('should throw error for negative units', () => {
      const availability = Availability.create('prop1', validDateRange, 5);
      expect(() => {
        availability.updateAvailableUnits(-1);
      }).toThrow('Available units cannot be negative');
    });
  });

  describe('addRestriction', () => {
    it('should add valid restriction', () => {
      const availability = Availability.create('prop1', validDateRange, 5);
      availability.addRestriction(validRestriction);
      expect(availability.getRestrictions()).toContainEqual(validRestriction);
    });

    it('should throw error for invalid restriction', () => {
      const availability = Availability.create('prop1', validDateRange, 5);
      const invalidRestriction = {
        type: 'INVALID' as any,
        value: '3',
        description: 'Invalid'
      };
      
      expect(() => {
        availability.addRestriction(invalidRestriction);
      }).toThrow();
    });
  });
});
