import { describe, it, expect, beforeEach } from 'vitest';
import { Property } from '@/domain/property/entities/Property';
import { PropertyId, BuildingId } from '@/domain/property/types';

describe('Property Entity', () => {
  let validPropertyId: PropertyId;
  let validBuildingId: BuildingId;

  beforeEach(() => {
    validPropertyId = 'prop-123' as PropertyId;
    validBuildingId = 'building-456' as BuildingId;
  });

  describe('create', () => {
    it('should create valid property', () => {
      const property = Property.create(
        validPropertyId,
        validBuildingId,
        2,
        3,
        'A301'
      );

      expect(property.getId()).toBe(validPropertyId);
      expect(property.getBuildingId()).toBe(validBuildingId);
      expect(property.getBedrooms()).toBe(2);
      expect(property.getFloor()).toBe(3);
      expect(property.getUnit()).toBe('A301');
    });

    it('should throw error for invalid bedrooms', () => {
      expect(() => {
        Property.create(
          validPropertyId,
          validBuildingId,
          5 as any,
          3,
          'A301'
        );
      }).toThrow();
    });

    it('should throw error for negative floor', () => {
      expect(() => {
        Property.create(
          validPropertyId,
          validBuildingId,
          2,
          -1,
          'A301'
        );
      }).toThrow();
    });

    it('should throw error for empty unit', () => {
      expect(() => {
        Property.create(
          validPropertyId,
          validBuildingId,
          2,
          3,
          ''
        );
      }).toThrow();
    });
  });

  describe('toJSON', () => {
    it('should return valid JSON representation', () => {
      const property = Property.create(
        validPropertyId,
        validBuildingId,
        2,
        3,
        'A301'
      );

      expect(property.toJSON()).toEqual({
        id: validPropertyId,
        buildingId: validBuildingId,
        bedrooms: 2,
        floor: 3,
        unit: 'A301'
      });
    });
  });
});
