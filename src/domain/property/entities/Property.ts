/**
 * Property Entity
 * @package HexPropertyBooking
 */

import { PropertyId, BuildingId } from '../types';
import { PropertySchema } from '../schemas';

export class Property {
  private constructor(
    private readonly id: PropertyId,
    private readonly buildingId: BuildingId,
    private readonly bedrooms: 1 | 2 | 3 | 4,
    private readonly floor: number,
    private readonly unit: string
  ) {}

  static create(
    id: PropertyId,
    buildingId: BuildingId,
    bedrooms: 1 | 2 | 3 | 4,
    floor: number,
    unit: string
  ): Property {
    const propertyData = { id, buildingId, bedrooms, floor, unit };
    PropertySchema.parse(propertyData);
    return new Property(id, buildingId, bedrooms, floor, unit);
  }

  getId(): PropertyId {
    return this.id;
  }

  getBuildingId(): BuildingId {
    return this.buildingId;
  }

  getBedrooms(): 1 | 2 | 3 | 4 {
    return this.bedrooms;
  }

  getFloor(): number {
    return this.floor;
  }

  getUnit(): string {
    return this.unit;
  }

  toJSON() {
    return {
      id: this.id,
      buildingId: this.buildingId,
      bedrooms: this.bedrooms,
      floor: this.floor,
      unit: this.unit
    };
  }
}
