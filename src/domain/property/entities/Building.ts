/**
 * Building Entity - Property Aggregate Root
 * @package HexPropertyBooking
 */

import { BuildingId, ZoneId, PropertyId } from '../types';
import { BuildingSchema } from '../schemas';
import { Property } from './Property';

export class Building {
  private constructor(
    private readonly id: BuildingId,
    private readonly name: string,
    private readonly zoneId: ZoneId,
    private readonly properties: Map<PropertyId, Property>
  ) {}

  static create(
    id: BuildingId,
    name: string,
    zoneId: ZoneId,
    properties: Property[] = []
  ): Building {
    const propertyMap = new Map(
      properties.map(p => [p.getId(), p])
    );

    const buildingData = {
      id,
      name,
      zone: zoneId,
      properties: properties.map(p => p.toJSON())
    };

    BuildingSchema.parse(buildingData);
    
    return new Building(id, name, zoneId, propertyMap);
  }

  getId(): BuildingId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getZoneId(): ZoneId {
    return this.zoneId;
  }

  getProperties(): Property[] {
    return Array.from(this.properties.values());
  }

  getProperty(propertyId: PropertyId): Property | undefined {
    return this.properties.get(propertyId);
  }

  hasProperty(propertyId: PropertyId): boolean {
    return this.properties.has(propertyId);
  }

  addProperty(property: Property): void {
    if (property.getBuildingId() !== this.id) {
      throw new Error('Property does not belong to this building');
    }
    this.properties.set(property.getId(), property);
  }

  removeProperty(propertyId: PropertyId): void {
    if (!this.properties.delete(propertyId)) {
      throw new Error('Property not found in building');
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      zone: this.zoneId,
      properties: this.getProperties().map(p => p.toJSON())
    };
  }
}
