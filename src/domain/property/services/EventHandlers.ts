/**
 * Event Handlers for Property Hierarchy
 * @package HexPropertyBooking
 */

import {
  PropertyCreatedEvent,
  PropertyUpdatedEvent,
  PropertyDeletedEvent,
  BuildingCreatedEvent,
  BuildingUpdatedEvent,
  BuildingDeletedEvent,
  ZoneCreatedEvent,
  ZoneUpdatedEvent,
  ZoneDeletedEvent,
  CompoundCreatedEvent,
  CompoundUpdatedEvent,
  CompoundDeletedEvent,
  LocationCreatedEvent,
  LocationUpdatedEvent,
  LocationDeletedEvent
} from '../events/PropertyEvents';

export interface EventHandler<T> {
  handle(event: T): Promise<void>;
}

export class PropertyEventHandler implements 
  EventHandler<PropertyCreatedEvent>,
  EventHandler<PropertyUpdatedEvent>,
  EventHandler<PropertyDeletedEvent> {
  
  async handle(event: PropertyCreatedEvent | PropertyUpdatedEvent | PropertyDeletedEvent): Promise<void> {
    switch (event.type) {
      case 'PropertyCreated':
        await this.handlePropertyCreation(event);
        break;
      case 'PropertyUpdated':
        await this.handlePropertyUpdate(event);
        break;
      case 'PropertyDeleted':
        await this.handlePropertyDeletion(event);
        break;
    }
  }

  private async handlePropertyCreation(event: PropertyCreatedEvent): Promise<void> {
    // Log creation, validate, trigger downstream processes
    console.log(`Property ${event.propertyId} created in building ${event.buildingId}`);
  }

  private async handlePropertyUpdate(event: PropertyUpdatedEvent): Promise<void> {
    // Handle property updates, validate changes
    console.log(`Property ${event.propertyId} updated with changes`, event.changes);
  }

  private async handlePropertyDeletion(event: PropertyDeletedEvent): Promise<void> {
    // Clean up related resources, log deletion
    console.log(`Property ${event.propertyId} deleted from building ${event.buildingId}`);
  }
}

export class BuildingEventHandler implements 
  EventHandler<BuildingCreatedEvent>,
  EventHandler<BuildingUpdatedEvent>,
  EventHandler<BuildingDeletedEvent> {
  
  async handle(event: BuildingCreatedEvent | BuildingUpdatedEvent | BuildingDeletedEvent): Promise<void> {
    switch (event.type) {
      case 'BuildingCreated':
        await this.handleBuildingCreation(event);
        break;
      case 'BuildingUpdated':
        await this.handleBuildingUpdate(event);
        break;
      case 'BuildingDeleted':
        await this.handleBuildingDeletion(event);
        break;
    }
  }

  private async handleBuildingCreation(event: BuildingCreatedEvent): Promise<void> {
    console.log(`Building ${event.buildingId} created in zone ${event.zoneId}`);
  }

  private async handleBuildingUpdate(event: BuildingUpdatedEvent): Promise<void> {
    console.log(`Building ${event.buildingId} updated with changes`, event.changes);
  }

  private async handleBuildingDeletion(event: BuildingDeletedEvent): Promise<void> {
    console.log(`Building ${event.buildingId} deleted from zone ${event.zoneId}`);
  }
}

export class ZoneEventHandler implements 
  EventHandler<ZoneCreatedEvent>,
  EventHandler<ZoneUpdatedEvent>,
  EventHandler<ZoneDeletedEvent> {
  
  async handle(event: ZoneCreatedEvent | ZoneUpdatedEvent | ZoneDeletedEvent): Promise<void> {
    switch (event.type) {
      case 'ZoneCreated':
        await this.handleZoneCreation(event);
        break;
      case 'ZoneUpdated':
        await this.handleZoneUpdate(event);
        break;
      case 'ZoneDeleted':
        await this.handleZoneDeletion(event);
        break;
    }
  }

  private async handleZoneCreation(event: ZoneCreatedEvent): Promise<void> {
    console.log(`Zone ${event.zoneId} created in compound ${event.compoundId}`);
  }

  private async handleZoneUpdate(event: ZoneUpdatedEvent): Promise<void> {
    console.log(`Zone ${event.zoneId} updated with changes`, event.changes);
  }

  private async handleZoneDeletion(event: ZoneDeletedEvent): Promise<void> {
    console.log(`Zone ${event.zoneId} deleted from compound ${event.compoundId}`);
  }
}

export class CompoundEventHandler implements 
  EventHandler<CompoundCreatedEvent>,
  EventHandler<CompoundUpdatedEvent>,
  EventHandler<CompoundDeletedEvent> {
  
  async handle(event: CompoundCreatedEvent | CompoundUpdatedEvent | CompoundDeletedEvent): Promise<void> {
    switch (event.type) {
      case 'CompoundCreated':
        await this.handleCompoundCreation(event);
        break;
      case 'CompoundUpdated':
        await this.handleCompoundUpdate(event);
        break;
      case 'CompoundDeleted':
        await this.handleCompoundDeletion(event);
        break;
    }
  }

  private async handleCompoundCreation(event: CompoundCreatedEvent): Promise<void> {
    console.log(`Compound ${event.compoundId} created in location ${event.locationId}`);
  }

  private async handleCompoundUpdate(event: CompoundUpdatedEvent): Promise<void> {
    console.log(`Compound ${event.compoundId} updated with changes`, event.changes);
  }

  private async handleCompoundDeletion(event: CompoundDeletedEvent): Promise<void> {
    console.log(`Compound ${event.compoundId} deleted from location ${event.locationId}`);
  }
}

export class LocationEventHandler implements 
  EventHandler<LocationCreatedEvent>,
  EventHandler<LocationUpdatedEvent>,
  EventHandler<LocationDeletedEvent> {
  
  async handle(event: LocationCreatedEvent | LocationUpdatedEvent | LocationDeletedEvent): Promise<void> {
    switch (event.type) {
      case 'LocationCreated':
        await this.handleLocationCreation(event);
        break;
      case 'LocationUpdated':
        await this.handleLocationUpdate(event);
        break;
      case 'LocationDeleted':
        await this.handleLocationDeletion(event);
        break;
    }
  }

  private async handleLocationCreation(event: LocationCreatedEvent): Promise<void> {
    console.log(`Location ${event.locationId} created with name ${event.name}`);
  }

  private async handleLocationUpdate(event: LocationUpdatedEvent): Promise<void> {
    console.log(`Location updated with changes`, event.changes);
  }

  private async handleLocationDeletion(event: LocationDeletedEvent): Promise<void> {
    console.log(`Location ${event.locationId} deleted`);
  }
}
