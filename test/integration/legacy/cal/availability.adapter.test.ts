import { describe, it, expect } from 'vitest';
import { CalAvailabilityAdapter } from '../../../../src/integration/legacy/cal/availability.adapter';

describe('CalAvailabilityAdapter', () => {
  describe('toDomain', () => {
    it('should correctly map legacy response to domain model', () => {
      const legacyResponse = {
        date: '2024-01-01',
        room_type_id: 1,
        availability: 5,
        restrictions: ['MIN_STAY:2:Minimum 2 nights stay']
      };

      const result = CalAvailabilityAdapter.toDomain(legacyResponse);

      expect(result).toEqual({
        isAvailable: true,
        availableUnits: 5,
        restrictions: [{
          type: 'MIN_STAY',
          value: '2',
          description: 'Minimum 2 nights stay'
        }]
      });
    });
  });

  describe('toLegacy', () => {
    it('should correctly map domain model to legacy format', () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05')
      };

      const result = CalAvailabilityAdapter.toLegacy(dateRange);

      expect(result).toEqual({
        start_date: '2024-01-01',
        end_date: '2024-01-05'
      });
    });
  });
});
