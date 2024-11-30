import { describe, it, expect, beforeEach } from 'vitest';
import { Location } from '@/domain/property/entities/Location';
import { Compound } from '@/domain/property/entities/Compound';
import { LocationId, CompoundId } from '@/domain/property/types';
import { GeoCoordinates } from '@/domain/property/schemas';

describe('Location Entity', () => {
  let validLocationId: LocationId;
  let validCompoundId: CompoundId;
  let validCompound: Compound;
  let validCoordinates: GeoCoordinates;

  beforeEach(() => {
    validLocationId = 'location-123' as LocationId;
    validCompoundId = 'compound-456' as CompoundId;
    validCoordinates = {
      latitude: 37.7749,
      longitude: -122.4194
    };
    validCompound = Compound.create(
      validCompoundId,
      'Compound A',
      validLocationId,
      [],
      true
    );
  });

  describe('create', () => {
    it('should create valid location', () => {
      const location = Location.create(
        validLocationId,
        'San Francisco Location',
        validCoordinates,
        '123 Main St, San Francisco, CA 94105',
        [validCompound]
      );

      expect(location.getId()).toBe(validLocationId);
      expect(location.getName()).toBe('San Francisco Location');
      expect(location.getCoordinates()).toEqual(validCoordinates);
      expect(location.getAddress()).toBe('123 Main St, San Francisco, CA 94105');
      expect(location.getCompounds()).toHaveLength(1);
    });

    it('should create location without compounds', () => {
      const location = Location.create(
        validLocationId,
        'San Francisco Location',
        validCoordinates,
        '123 Main St, San Francisco, CA 94105'
      );

      expect(location.getCompounds()).toHaveLength(0);
    });

    it('should throw error for empty name', () => {
      expect(() => {
        Location.create(
          validLocationId,
          '',
          validCoordinates,
          '123 Main St'
        );
      }).toThrow();
    });

    it('should throw error for invalid coordinates', () => {
      expect(() => {
        Location.create(
          validLocationId,
          'Location A',
          { latitude: 91, longitude: 0 },
          '123 Main St'
        );
      }).toThrow();
    });
  });

  describe('compound management', () => {
    it('should add compound', () => {
      const location = Location.create(
        validLocationId,
        'Location A',
        validCoordinates,
        '123 Main St'
      );
      location.addCompound(validCompound);
      
      expect(location.getCompound(validCompoundId)).toBeDefined();
    });

    it('should throw error when adding compound from different location', () => {
      const location = Location.create(
        validLocationId,
        'Location A',
        validCoordinates,
        '123 Main St'
      );
      const wrongCompound = Compound.create(
        'other-compound' as CompoundId,
        'Compound B',
        'other-location' as LocationId
      );

      expect(() => {
        location.addCompound(wrongCompound);
      }).toThrow('Compound does not belong to this location');
    });

    it('should remove compound', () => {
      const location = Location.create(
        validLocationId,
        'Location A',
        validCoordinates,
        '123 Main St',
        [validCompound]
      );

      location.removeCompound(validCompoundId);
      expect(location.getCompound(validCompoundId)).toBeUndefined();
    });
  });

  describe('facility management', () => {
    it('should list all facilities', () => {
      const location = Location.create(
        validLocationId,
        'Location A',
        validCoordinates,
        '123 Main St',
        [validCompound]
      );

      const facilities = location.getAllFacilities();
      expect(facilities).toHaveLength(1);
      expect(facilities[0].compoundId).toBe(validCompoundId);
    });
  });

  describe('distance calculation', () => {
    it('should calculate distance between coordinates', () => {
      const location = Location.create(
        validLocationId,
        'San Francisco',
        validCoordinates,
        '123 Main St'
      );

      const newYorkCoordinates = {
        latitude: 40.7128,
        longitude: -74.0060
      };

      const distance = location.calculateDistance(newYorkCoordinates);
      expect(distance).toBeCloseTo(4128, -2); // Approximately 4128 km
    });

    it('should return zero for same coordinates', () => {
      const location = Location.create(
        validLocationId,
        'San Francisco',
        validCoordinates,
        '123 Main St'
      );

      const distance = location.calculateDistance(validCoordinates);
      expect(distance).toBe(0);
    });
  });

  describe('toJSON', () => {
    it('should return valid JSON representation', () => {
      const location = Location.create(
        validLocationId,
        'Location A',
        validCoordinates,
        '123 Main St',
        [validCompound]
      );

      expect(location.toJSON()).toEqual({
        id: validLocationId,
        name: 'Location A',
        coordinates: validCoordinates,
        address: '123 Main St',
        compounds: [validCompound.toJSON()]
      });
    });
  });
});
