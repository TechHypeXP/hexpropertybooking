import { describe, it, expect, beforeEach } from 'vitest';
import { Building } from '@/domain/property/entities/Building';
import { Property } from '@/domain/property/entities/Property';
import { BuildingId, ZoneId, PropertyId } from '@/domain/property/types';

describe('Building Entity', () => {
  let validBuildingId: BuildingId;
  let validZoneId: ZoneId;
  let validProperty: Property;

  beforeEach(() => {
    validBuildingId = 'building-123' as BuildingId;
    validZoneId = 'zone-456' as ZoneId;
    validProperty = Property.create(
      'prop-123' as PropertyId,
      validBuildingId,
      2,
      3,
      'A301'
    );
  });

  describe('create', () => {
    it('should create valid building', () => {
      const building = Building.create(
        validBuildingId,
        'Tower A',
        validZoneId,
        [validProperty]
      );

      expect(building.getId()).toBe(validBuildingId);
      expect(building.getName()).toBe('Tower A');
      expect(building.getZoneId()).toBe(validZoneId);
      expect(building.getProperties()).toHaveLength(1);
    });

    it('should create building without properties', () => {
      const building = Building.create(
        validBuildingId,
        'Tower A',
        validZoneId
      );

      expect(building.getProperties()).toHaveLength(0);
    });

    it('should throw error for empty name', () => {
      expect(() => {
        Building.create(validBuildingId, '', validZoneId);
      }).toThrow();
    });
  });

  describe('property management', () => {
    it('should add property', () => {
      const building = Building.create(validBuildingId, 'Tower A', validZoneId);
      building.addProperty(validProperty);
      
      expect(building.hasProperty(validProperty.getId())).toBe(true);
      expect(building.getProperty(validProperty.getId())).toBeDefined();
    });

    it('should throw error when adding property from different building', () => {
      const building = Building.create(validBuildingId, 'Tower A', validZoneId);
      const wrongProperty = Property.create(
        'prop-456' as PropertyId,
        'other-building' as BuildingId,
        2,
        3,
        'B301'
      );

      expect(() => {
        building.addProperty(wrongProperty);
      }).toThrow('Property does not belong to this building');
    });

    it('should remove property', () => {
      const building = Building.create(
        validBuildingId,
        'Tower A',
        validZoneId,
        [validProperty]
      );

      building.removeProperty(validProperty.getId());
      expect(building.hasProperty(validProperty.getId())).toBe(false);
    });

    it('should throw error when removing non-existent property', () => {
      const building = Building.create(validBuildingId, 'Tower A', validZoneId);
      
      expect(() => {
        building.removeProperty('non-existent' as PropertyId);
      }).toThrow('Property not found in building');
    });
  });

  describe('toJSON', () => {
    it('should return valid JSON representation', () => {
      const building = Building.create(
        validBuildingId,
        'Tower A',
        validZoneId,
        [validProperty]
      );

      const json = building.toJSON();
      expect(json).toEqual({
        id: validBuildingId,
        name: 'Tower A',
        zone: validZoneId,
        properties: [validProperty.toJSON()]
      });
    });
  });
});
