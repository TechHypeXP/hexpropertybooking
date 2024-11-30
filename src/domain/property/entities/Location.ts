/**
 * Location Entity - Property Hierarchy Root
 * @package HexPropertyBooking
 */

import { LocationId, CompoundId } from '../types';
import { LocationSchema, GeoCoordinates } from '../schemas';
import { Compound } from './Compound';

export class Location {
  private constructor(
    private readonly id: LocationId,
    private readonly name: string,
    private readonly coordinates: GeoCoordinates,
    private readonly compounds: Map<CompoundId, Compound>,
    private readonly address: string
  ) {}

  static create(
    id: LocationId,
    name: string,
    coordinates: GeoCoordinates,
    address: string,
    compounds: Compound[] = []
  ): Location {
    const compoundMap = new Map(
      compounds.map(c => [c.getId(), c])
    );

    const locationData = {
      id,
      name,
      coordinates,
      address,
      compounds: compounds.map(c => c.toJSON())
    };

    LocationSchema.parse(locationData);

    return new Location(
      id,
      name,
      coordinates,
      compoundMap,
      address
    );
  }

  getId(): LocationId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getCoordinates(): GeoCoordinates {
    return { ...this.coordinates };
  }

  getAddress(): string {
    return this.address;
  }

  getCompounds(): Compound[] {
    return Array.from(this.compounds.values());
  }

  getCompound(compoundId: CompoundId): Compound | undefined {
    return this.compounds.get(compoundId);
  }

  addCompound(compound: Compound): void {
    if (compound.getLocationId() !== this.id) {
      throw new Error('Compound does not belong to this location');
    }
    this.compounds.set(compound.getId(), compound);
  }

  removeCompound(compoundId: CompoundId): void {
    if (!this.compounds.delete(compoundId)) {
      throw new Error('Compound not found in location');
    }
  }

  getAllFacilities(): Array<{ compoundId: CompoundId; facilities: any[] }> {
    return this.getCompounds().map(compound => ({
      compoundId: compound.getId(),
      facilities: compound.getAllFacilities()
    }));
  }

  calculateDistance(coordinates: GeoCoordinates): number {
    // Haversine formula implementation
    const R = 6371; // Earth's radius in kilometers
    const lat1 = this.coordinates.latitude * Math.PI / 180;
    const lat2 = coordinates.latitude * Math.PI / 180;
    const dLat = (coordinates.latitude - this.coordinates.latitude) * Math.PI / 180;
    const dLon = (coordinates.longitude - this.coordinates.longitude) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      coordinates: this.coordinates,
      address: this.address,
      compounds: this.getCompounds().map(c => c.toJSON())
    };
  }
}
