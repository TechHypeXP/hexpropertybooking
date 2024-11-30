/**
 * Application Services for Property Hierarchy
 * @package HexPropertyBooking
 */

import { 
  Property, 
  Building, 
  Zone, 
  Compound, 
  Location 
} from '../entities';
import { 
  PropertyCreatedEvent, 
  BuildingCreatedEvent,
  ZoneCreatedEvent,
  CompoundCreatedEvent,
  LocationCreatedEvent
} from '../events/PropertyEvents';
import { globalEventBus } from './EventBus';
import { 
  PropertyId, 
  BuildingId, 
  ZoneId, 
  CompoundId, 
  LocationId 
} from '../types';

export class PropertyApplicationService {
  async createProperty(
    propertyId: PropertyId,
    buildingId: BuildingId,
    bedrooms: number,
    floor: number,
    unit: string
  ): Promise<Property> {
    const property = Property.create(
      propertyId, 
      buildingId, 
      bedrooms, 
      floor, 
      unit
    );

    const event = new PropertyCreatedEvent(
      propertyId, 
      buildingId, 
      bedrooms, 
      floor, 
      unit
    );

    await globalEventBus.publish(event);
    return property;
  }
}

export class BuildingApplicationService {
  constructor(
    private propertyService: PropertyApplicationService
  ) {}

  async createBuilding(
    buildingId: BuildingId,
    zoneId: ZoneId,
    name: string,
    properties: Array<{
      propertyId: PropertyId;
      bedrooms: number;
      floor: number;
      unit: string;
    }> = []
  ): Promise<Building> {
    const createdProperties = await Promise.all(
      properties.map(p => 
        this.propertyService.createProperty(
          p.propertyId, 
          buildingId, 
          p.bedrooms, 
          p.floor, 
          p.unit
        )
      )
    );

    const building = Building.create(
      buildingId, 
      name, 
      zoneId, 
      createdProperties
    );

    const event = new BuildingCreatedEvent(
      buildingId, 
      zoneId, 
      name
    );

    await globalEventBus.publish(event);
    return building;
  }
}

export class ZoneApplicationService {
  constructor(
    private buildingService: BuildingApplicationService
  ) {}

  async createZone(
    zoneId: ZoneId,
    compoundId: CompoundId,
    name: string,
    buildings: Array<{
      buildingId: BuildingId;
      name: string;
      properties?: Array<{
        propertyId: PropertyId;
        bedrooms: number;
        floor: number;
        unit: string;
      }>;
    }> = []
  ): Promise<Zone> {
    const createdBuildings = await Promise.all(
      buildings.map(b => 
        this.buildingService.createBuilding(
          b.buildingId, 
          zoneId, 
          b.name, 
          b.properties
        )
      )
    );

    const zone = Zone.create(
      zoneId, 
      name, 
      compoundId, 
      createdBuildings
    );

    const event = new ZoneCreatedEvent(
      zoneId, 
      compoundId, 
      name
    );

    await globalEventBus.publish(event);
    return zone;
  }
}

export class CompoundApplicationService {
  constructor(
    private zoneService: ZoneApplicationService
  ) {}

  async createCompound(
    compoundId: CompoundId,
    locationId: LocationId,
    name: string,
    sharedFacilities: boolean = false,
    zones: Array<{
      zoneId: ZoneId;
      name: string;
      buildings?: Array<{
        buildingId: BuildingId;
        name: string;
        properties?: Array<{
          propertyId: PropertyId;
          bedrooms: number;
          floor: number;
          unit: string;
        }>;
      }>;
    }> = []
  ): Promise<Compound> {
    const createdZones = await Promise.all(
      zones.map(z => 
        this.zoneService.createZone(
          z.zoneId, 
          compoundId, 
          z.name, 
          z.buildings
        )
      )
    );

    const compound = Compound.create(
      compoundId, 
      name, 
      locationId, 
      createdZones, 
      sharedFacilities
    );

    const event = new CompoundCreatedEvent(
      compoundId, 
      locationId, 
      name, 
      sharedFacilities
    );

    await globalEventBus.publish(event);
    return compound;
  }
}

export class LocationApplicationService {
  constructor(
    private compoundService: CompoundApplicationService
  ) {}

  async createLocation(
    locationId: LocationId,
    name: string,
    coordinates: { latitude: number; longitude: number },
    address: string,
    compounds: Array<{
      compoundId: CompoundId;
      name: string;
      sharedFacilities?: boolean;
      zones?: Array<{
        zoneId: ZoneId;
        name: string;
        buildings?: Array<{
          buildingId: BuildingId;
          name: string;
          properties?: Array<{
            propertyId: PropertyId;
            bedrooms: number;
            floor: number;
            unit: string;
          }>;
        }>;
      }>;
    }> = []
  ): Promise<Location> {
    const createdCompounds = await Promise.all(
      compounds.map(c => 
        this.compoundService.createCompound(
          c.compoundId, 
          locationId, 
          c.name, 
          c.sharedFacilities, 
          c.zones
        )
      )
    );

    const location = Location.create(
      locationId, 
      name, 
      coordinates, 
      address, 
      createdCompounds
    );

    const event = new LocationCreatedEvent(
      locationId, 
      name, 
      coordinates, 
      address
    );

    await globalEventBus.publish(event);
    return location;
  }
}
