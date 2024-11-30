/**
 * Domain Events for Property Hierarchy
 * @package HexPropertyBooking
 */

import { 
  PropertyId, 
  BuildingId, 
  ZoneId, 
  CompoundId, 
  LocationId 
} from '../types';

export interface DomainEvent {
  id: string;
  timestamp: Date;
  type: string;
}

export interface PropertyEvent extends DomainEvent {
  propertyId: PropertyId;
  buildingId: BuildingId;
}

export interface BuildingEvent extends DomainEvent {
  buildingId: BuildingId;
  zoneId: ZoneId;
}

export interface ZoneEvent extends DomainEvent {
  zoneId: ZoneId;
  compoundId: CompoundId;
}

export interface CompoundEvent extends DomainEvent {
  compoundId: CompoundId;
  locationId: LocationId;
}

export interface LocationEvent extends DomainEvent {
  locationId: LocationId;
}

export class PropertyCreatedEvent implements PropertyEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'PropertyCreated';

  constructor(
    public propertyId: PropertyId,
    public buildingId: BuildingId,
    public bedrooms: number,
    public floor: number,
    public unit: string
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class PropertyUpdatedEvent implements PropertyEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'PropertyUpdated';

  constructor(
    public propertyId: PropertyId,
    public buildingId: BuildingId,
    public changes: Partial<{
      bedrooms: number;
      floor: number;
      unit: string;
    }>
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class PropertyDeletedEvent implements PropertyEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'PropertyDeleted';

  constructor(
    public propertyId: PropertyId,
    public buildingId: BuildingId
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class BuildingCreatedEvent implements BuildingEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'BuildingCreated';

  constructor(
    public buildingId: BuildingId,
    public zoneId: ZoneId,
    public name: string
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class BuildingUpdatedEvent implements BuildingEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'BuildingUpdated';

  constructor(
    public buildingId: BuildingId,
    public zoneId: ZoneId,
    public changes: Partial<{
      name: string;
    }>
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class BuildingDeletedEvent implements BuildingEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'BuildingDeleted';

  constructor(
    public buildingId: BuildingId,
    public zoneId: ZoneId
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class ZoneCreatedEvent implements ZoneEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'ZoneCreated';

  constructor(
    public zoneId: ZoneId,
    public compoundId: CompoundId,
    public name: string
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class ZoneUpdatedEvent implements ZoneEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'ZoneUpdated';

  constructor(
    public zoneId: ZoneId,
    public compoundId: CompoundId,
    public changes: Partial<{
      name: string;
      facilities: any[];
      accessRules: any[];
    }>
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class ZoneDeletedEvent implements ZoneEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'ZoneDeleted';

  constructor(
    public zoneId: ZoneId,
    public compoundId: CompoundId
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class CompoundCreatedEvent implements CompoundEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'CompoundCreated';

  constructor(
    public compoundId: CompoundId,
    public locationId: LocationId,
    public name: string,
    public sharedFacilities: boolean
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class CompoundUpdatedEvent implements CompoundEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'CompoundUpdated';

  constructor(
    public compoundId: CompoundId,
    public locationId: LocationId,
    public changes: Partial<{
      name: string;
      sharedFacilities: boolean;
    }>
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class CompoundDeletedEvent implements CompoundEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'CompoundDeleted';

  constructor(
    public compoundId: CompoundId,
    public locationId: LocationId
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class LocationCreatedEvent implements LocationEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'LocationCreated';

  constructor(
    public locationId: LocationId,
    public name: string,
    public coordinates: { latitude: number; longitude: number },
    public address: string
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class LocationUpdatedEvent implements LocationEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'LocationUpdated';

  constructor(
    public locationId: LocationId,
    public changes: Partial<{
      name: string;
      coordinates: { latitude: number; longitude: number };
      address: string;
    }>
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

export class LocationDeletedEvent implements LocationEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string = 'LocationDeleted';

  constructor(
    public locationId: LocationId
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
}
