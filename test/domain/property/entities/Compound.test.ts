import { describe, it, expect, beforeEach } from 'vitest';
import { Compound } from '@/domain/property/entities/Compound';
import { Zone } from '@/domain/property/entities/Zone';
import { CompoundId, LocationId, ZoneId } from '@/domain/property/types';

describe('Compound Entity', () => {
  let validCompoundId: CompoundId;
  let validLocationId: LocationId;
  let validZone: Zone;
  let validZoneId: ZoneId;

  beforeEach(() => {
    validCompoundId = 'compound-123' as CompoundId;
    validLocationId = 'location-456' as LocationId;
    validZoneId = 'zone-789' as ZoneId;
    validZone = Zone.create(
      validZoneId,
      'Zone A',
      validCompoundId,
      [],
      [{
        id: 'facility-123',
        name: 'Gym',
        capacity: 30
      }]
    );
  });

  describe('create', () => {
    it('should create valid compound', () => {
      const compound = Compound.create(
        validCompoundId,
        'Residential Compound A',
        validLocationId,
        [validZone],
        true
      );

      expect(compound.getId()).toBe(validCompoundId);
      expect(compound.getName()).toBe('Residential Compound A');
      expect(compound.getLocationId()).toBe(validLocationId);
      expect(compound.getZones()).toHaveLength(1);
      expect(compound.hasSharedFacilities()).toBe(true);
    });

    it('should create compound without zones', () => {
      const compound = Compound.create(
        validCompoundId,
        'Residential Compound A',
        validLocationId
      );

      expect(compound.getZones()).toHaveLength(0);
      expect(compound.hasSharedFacilities()).toBe(false);
    });

    it('should throw error for empty name', () => {
      expect(() => {
        Compound.create(validCompoundId, '', validLocationId);
      }).toThrow();
    });
  });

  describe('zone management', () => {
    it('should add zone', () => {
      const compound = Compound.create(
        validCompoundId,
        'Compound A',
        validLocationId
      );
      compound.addZone(validZone);
      
      expect(compound.getZone(validZoneId)).toBeDefined();
    });

    it('should throw error when adding zone from different compound', () => {
      const compound = Compound.create(
        validCompoundId,
        'Compound A',
        validLocationId
      );
      const wrongZone = Zone.create(
        'other-zone' as ZoneId,
        'Zone B',
        'other-compound' as CompoundId
      );

      expect(() => {
        compound.addZone(wrongZone);
      }).toThrow('Zone does not belong to this compound');
    });

    it('should remove zone', () => {
      const compound = Compound.create(
        validCompoundId,
        'Compound A',
        validLocationId,
        [validZone]
      );

      compound.removeZone(validZoneId);
      expect(compound.getZone(validZoneId)).toBeUndefined();
    });
  });

  describe('facility management', () => {
    it('should list all facilities', () => {
      const compound = Compound.create(
        validCompoundId,
        'Compound A',
        validLocationId,
        [validZone]
      );

      const facilities = compound.getAllFacilities();
      expect(facilities).toHaveLength(1);
      expect(facilities[0].facilities).toHaveLength(1);
      expect(facilities[0].zoneId).toBe(validZoneId);
    });

    it('should check facility access with shared facilities', () => {
      const compound = Compound.create(
        validCompoundId,
        'Compound A',
        validLocationId,
        [validZone],
        true
      );

      expect(compound.canAccessFacility(
        'facility-123',
        validZoneId,
        validZoneId
      )).toBe(true);
    });

    it('should deny facility access without shared facilities', () => {
      const compound = Compound.create(
        validCompoundId,
        'Compound A',
        validLocationId,
        [validZone],
        false
      );

      expect(compound.canAccessFacility(
        'facility-123',
        'other-zone' as ZoneId,
        validZoneId
      )).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return valid JSON representation', () => {
      const compound = Compound.create(
        validCompoundId,
        'Compound A',
        validLocationId,
        [validZone],
        true
      );

      expect(compound.toJSON()).toEqual({
        id: validCompoundId,
        name: 'Compound A',
        location: validLocationId,
        zones: [validZone.toJSON()],
        sharedFacilities: true
      });
    });
  });
});
