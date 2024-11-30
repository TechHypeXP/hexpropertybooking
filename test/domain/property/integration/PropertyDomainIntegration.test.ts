/**
 * Property Domain Integration Tests
 * @package HexPropertyBooking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PropertyTestUtils } from '../PropertyTestUtils';
import { 
  PropertyApplicationService,
  BuildingApplicationService,
  ZoneApplicationService,
  CompoundApplicationService,
  LocationApplicationService
} from '@/domain/property/services/ApplicationServices';
import { globalEventBus } from '@/domain/property/services/EventBus';

describe('Property Domain Integration', () => {
  let propertyService: PropertyApplicationService;
  let buildingService: BuildingApplicationService;
  let zoneService: ZoneApplicationService;
  let compoundService: CompoundApplicationService;
  let locationService: LocationApplicationService;

  beforeEach(() => {
    // Setup dependency injection
    propertyService = new PropertyApplicationService();
    buildingService = new BuildingApplicationService(propertyService);
    zoneService = new ZoneApplicationService(buildingService);
    compoundService = new CompoundApplicationService(zoneService);
    locationService = new LocationApplicationService(compoundService);

    // Reset event bus before each test
    globalEventBus.clearDeadLetterQueue();
  });

  describe('Full Property Hierarchy Creation', () => {
    it('should create complete property hierarchy', async () => {
      const locationData = PropertyTestUtils.generateValidLocation();
      const compoundData = PropertyTestUtils.generateValidCompound(locationData.locationId);
      const zoneData = PropertyTestUtils.generateValidZone(compoundData.compoundId);
      const buildingData = PropertyTestUtils.generateValidBuilding(zoneData.zoneId);
      const propertyData = PropertyTestUtils.generateValidProperty(buildingData.buildingId);

      const location = await locationService.createLocation(
        locationData.locationId,
        locationData.name,
        locationData.coordinates,
        locationData.address,
        [{
          ...compoundData,
          zones: [{
            ...zoneData,
            buildings: [{
              ...buildingData,
              properties: [propertyData]
            }]
          }]
        }]
      );

      expect(location).toBeDefined();
      expect(location.getId()).toBe(locationData.locationId);
      expect(location.getCompounds()).toHaveLength(1);
      
      const compound = location.getCompounds()[0];
      expect(compound.getId()).toBe(compoundData.compoundId);
      expect(compound.getZones()).toHaveLength(1);
      
      const zone = compound.getZones()[0];
      expect(zone.getId()).toBe(zoneData.zoneId);
      expect(zone.getBuildings()).toHaveLength(1);
      
      const building = zone.getBuildings()[0];
      expect(building.getId()).toBe(buildingData.buildingId);
      expect(building.getProperties()).toHaveLength(1);
      
      const property = building.getProperties()[0];
      expect(property.getId()).toBe(propertyData.propertyId);
    });
  });

  describe('Event Publishing Validation', () => {
    it('should publish events during hierarchy creation', async () => {
      const locationData = PropertyTestUtils.generateValidLocation();
      const compoundData = PropertyTestUtils.generateValidCompound(locationData.locationId);
      const zoneData = PropertyTestUtils.generateValidZone(compoundData.compoundId);
      const buildingData = PropertyTestUtils.generateValidBuilding(zoneData.zoneId);
      const propertyData = PropertyTestUtils.generateValidProperty(buildingData.buildingId);

      const eventSpy = vi.spyOn(globalEventBus, 'publish');

      await locationService.createLocation(
        locationData.locationId,
        locationData.name,
        locationData.coordinates,
        locationData.address,
        [{
          ...compoundData,
          zones: [{
            ...zoneData,
            buildings: [{
              ...buildingData,
              properties: [propertyData]
            }]
          }]
        }]
      );

      expect(eventSpy).toHaveBeenCalledTimes(5); // Location, Compound, Zone, Building, Property events
      expect(globalEventBus.getDeadLetterQueue()).toHaveLength(0);
    });
  });

  describe('Complex Scenario Validation', () => {
    it('should handle multiple properties in building', async () => {
      const locationData = PropertyTestUtils.generateValidLocation();
      const compoundData = PropertyTestUtils.generateValidCompound(locationData.locationId);
      const zoneData = PropertyTestUtils.generateValidZone(compoundData.compoundId);
      const buildingData = PropertyTestUtils.generateValidBuilding(zoneData.zoneId);

      const properties = [
        PropertyTestUtils.generateValidProperty(buildingData.buildingId),
        PropertyTestUtils.generateValidProperty(buildingData.buildingId),
        PropertyTestUtils.generateValidProperty(buildingData.buildingId)
      ];

      const location = await locationService.createLocation(
        locationData.locationId,
        locationData.name,
        locationData.coordinates,
        locationData.address,
        [{
          ...compoundData,
          zones: [{
            ...zoneData,
            buildings: [{
              ...buildingData,
              properties
            }]
          }]
        }]
      );

      const building = location
        .getCompounds()[0]
        .getZones()[0]
        .getBuildings()[0];

      expect(building.getProperties()).toHaveLength(3);
    });
  });
});
