/**
 * Property Domain Test Utilities
 * @package HexPropertyBooking
 */

import { 
  PropertyId, 
  BuildingId, 
  ZoneId, 
  CompoundId, 
  LocationId 
} from '@/domain/property/types';

export class PropertyTestUtils {
  static generatePropertyId(): PropertyId {
    return `prop-${this.generateRandomString(8)}` as PropertyId;
  }

  static generateBuildingId(): BuildingId {
    return `building-${this.generateRandomString(8)}` as BuildingId;
  }

  static generateZoneId(): ZoneId {
    return `zone-${this.generateRandomString(8)}` as ZoneId;
  }

  static generateCompoundId(): CompoundId {
    return `compound-${this.generateRandomString(8)}` as CompoundId;
  }

  static generateLocationId(): LocationId {
    return `location-${this.generateRandomString(8)}` as LocationId;
  }

  static generateValidProperty(buildingId: BuildingId) {
    return {
      propertyId: this.generatePropertyId(),
      buildingId,
      bedrooms: this.randomBedrooms(),
      floor: this.randomFloor(),
      unit: this.generateUnit()
    };
  }

  static generateValidBuilding(zoneId: ZoneId) {
    return {
      buildingId: this.generateBuildingId(),
      zoneId,
      name: `Building ${this.generateRandomString(4)}`
    };
  }

  static generateValidZone(compoundId: CompoundId) {
    return {
      zoneId: this.generateZoneId(),
      compoundId,
      name: `Zone ${this.generateRandomString(4)}`
    };
  }

  static generateValidCompound(locationId: LocationId) {
    return {
      compoundId: this.generateCompoundId(),
      locationId,
      name: `Compound ${this.generateRandomString(4)}`,
      sharedFacilities: Math.random() > 0.5
    };
  }

  static generateValidLocation() {
    return {
      locationId: this.generateLocationId(),
      name: `Location ${this.generateRandomString(4)}`,
      coordinates: this.generateCoordinates(),
      address: this.generateAddress()
    };
  }

  private static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(
      { length }, 
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  private static randomBedrooms(): number {
    return Math.floor(Math.random() * 4) + 1; // 1-4 bedrooms
  }

  private static randomFloor(): number {
    return Math.floor(Math.random() * 20); // 0-19 floors
  }

  private static generateUnit(): string {
    const building = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const unit = Math.floor(Math.random() * 999) + 1; // 1-999
    return `${building}${unit}`;
  }

  private static generateCoordinates() {
    return {
      latitude: (Math.random() * 180 - 90),
      longitude: (Math.random() * 360 - 180)
    };
  }

  private static generateAddress(): string {
    const streetNumber = Math.floor(Math.random() * 9999) + 1;
    const streetNames = [
      'Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Washington', 
      'Park', 'Lake', 'Hill'
    ];
    const streetTypes = ['St', 'Ave', 'Rd', 'Blvd', 'Ln'];

    return `${streetNumber} ${streetNames[Math.floor(Math.random() * streetNames.length)]} ${streetTypes[Math.floor(Math.random() * streetTypes.length)]}`;
  }
}
