import { describe, it, expect, beforeEach } from 'vitest';
import { Zone } from '@/domain/property/entities/Zone';
import { Building } from '@/domain/property/entities/Building';
import { ZoneId, CompoundId, BuildingId } from '@/domain/property/types';
import { PublicFacility, AccessRule } from '@/domain/property/schemas';

describe('Zone Entity', () => {
  let validZoneId: ZoneId;
  let validCompoundId: CompoundId;
  let validBuilding: Building;
  let validFacility: PublicFacility;
  let validAccessRule: AccessRule;

  beforeEach(() => {
    validZoneId = 'zone-123' as ZoneId;
    validCompoundId = 'compound-456' as CompoundId;
    validBuilding = {
      id: 'building-789' as BuildingId,
      name: 'Tower A',
      zone: validZoneId,
      properties: []
    };
    validFacility = {
      id: 'facility-123',
      name: 'Swimming Pool',
      capacity: 50
    };
    validAccessRule = {
      facilityId: validFacility.id,
      allowedZones: [validZoneId]
    };
  });

  describe('create', () => {
    it('should create valid zone', () => {
      const zone = Zone.create(
        validZoneId,
        'Residential Zone A',
        validCompoundId,
        [validBuilding],
        [validFacility],
        [validAccessRule]
      );

      expect(zone.getId()).toBe(validZoneId);
      expect(zone.getName()).toBe('Residential Zone A');
      expect(zone.getCompoundId()).toBe(validCompoundId);
      expect(zone.getBuildings()).toHaveLength(1);
      expect(zone.getFacilities()).toHaveLength(1);
      expect(zone.getAccessRules()).toHaveLength(1);
    });

    it('should create zone without buildings and facilities', () => {
      const zone = Zone.create(
        validZoneId,
        'Residential Zone A',
        validCompoundId
      );

      expect(zone.getBuildings()).toHaveLength(0);
      expect(zone.getFacilities()).toHaveLength(0);
      expect(zone.getAccessRules()).toHaveLength(0);
    });

    it('should throw error for empty name', () => {
      expect(() => {
        Zone.create(validZoneId, '', validCompoundId);
      }).toThrow();
    });
  });

  describe('building management', () => {
    it('should add building', () => {
      const zone = Zone.create(validZoneId, 'Zone A', validCompoundId);
      zone.addBuilding(validBuilding);
      
      expect(zone.getBuilding(validBuilding.id)).toBeDefined();
    });

    it('should throw error when adding building from different zone', () => {
      const zone = Zone.create(validZoneId, 'Zone A', validCompoundId);
      const wrongBuilding = {
        ...validBuilding,
        zone: 'other-zone' as ZoneId
      };

      expect(() => {
        zone.addBuilding(wrongBuilding);
      }).toThrow('Building does not belong to this zone');
    });

    it('should remove building', () => {
      const zone = Zone.create(
        validZoneId,
        'Zone A',
        validCompoundId,
        [validBuilding]
      );

      zone.removeBuilding(validBuilding.id);
      expect(zone.getBuilding(validBuilding.id)).toBeUndefined();
    });
  });

  describe('facility management', () => {
    it('should add facility', () => {
      const zone = Zone.create(validZoneId, 'Zone A', validCompoundId);
      zone.addFacility(validFacility);
      
      expect(zone.getFacilities()).toContainEqual(validFacility);
    });

    it('should throw error when adding duplicate facility', () => {
      const zone = Zone.create(
        validZoneId,
        'Zone A',
        validCompoundId,
        [],
        [validFacility]
      );

      expect(() => {
        zone.addFacility(validFacility);
      }).toThrow('Facility already exists in zone');
    });
  });

  describe('access control', () => {
    it('should add access rule', () => {
      const zone = Zone.create(validZoneId, 'Zone A', validCompoundId);
      zone.addAccessRule(validAccessRule);
      
      expect(zone.getAccessRules()).toContainEqual(validAccessRule);
    });

    it('should check facility access', () => {
      const zone = Zone.create(
        validZoneId,
        'Zone A',
        validCompoundId,
        [],
        [validFacility],
        [validAccessRule]
      );

      expect(zone.canAccessFacility(validFacility.id, validZoneId)).toBe(true);
      expect(zone.canAccessFacility(validFacility.id, 'other-zone' as ZoneId)).toBe(false);
    });

    it('should allow access when no rule exists', () => {
      const zone = Zone.create(validZoneId, 'Zone A', validCompoundId);
      expect(zone.canAccessFacility('any-facility', validZoneId)).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should return valid JSON representation', () => {
      const zone = Zone.create(
        validZoneId,
        'Zone A',
        validCompoundId,
        [validBuilding],
        [validFacility],
        [validAccessRule]
      );

      expect(zone.toJSON()).toEqual({
        id: validZoneId,
        name: 'Zone A',
        compound: validCompoundId,
        buildings: [validBuilding],
        publicFacilities: [validFacility],
        accessRules: [validAccessRule]
      });
    });
  });
});
