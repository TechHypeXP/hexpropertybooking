/**
 * Domain entity for property availability
 * @package HexProperty
 */

import { PropertyId } from '../../property/types';
import { DateRange, AvailabilityStatus } from '../types';

export class PropertyAvailability {
  private constructor(
    private readonly propertyId: PropertyId,
    private readonly dateRange: DateRange,
    private isReserved: boolean,
    private maintenanceBlock?: DateRange
  ) {}

  /**
   * Creates new property availability
   */
  static create(
    propertyId: PropertyId,
    dateRange: DateRange,
    isReserved: boolean = false,
    maintenanceBlock?: DateRange
  ): PropertyAvailability {
    if (dateRange.startDate >= dateRange.endDate) {
      throw new Error('Invalid date range');
    }

    if (maintenanceBlock && this.dateRangesOverlap(dateRange, maintenanceBlock)) {
      throw new Error('Maintenance block overlaps with date range');
    }

    return new PropertyAvailability(propertyId, dateRange, isReserved, maintenanceBlock);
  }

  /**
   * Checks if property is available for given dates
   */
  isAvailable(): boolean {
    if (this.isReserved) return false;
    if (!this.maintenanceBlock) return true;
    
    return !this.dateRangesOverlap(this.dateRange, this.maintenanceBlock);
  }

  /**
   * Marks property as reserved
   */
  reserve(): void {
    if (this.isReserved) {
      throw new Error('Property already reserved');
    }
    this.isReserved = true;
  }

  /**
   * Gets current availability status
   */
  getStatus(): AvailabilityStatus {
    return {
      isAvailable: this.isAvailable(),
      availableUnits: this.isAvailable() ? 1 : 0,
      restrictions: []
    };
  }

  private static dateRangesOverlap(range1: DateRange, range2: DateRange): boolean {
    return range1.startDate <= range2.endDate && range2.startDate <= range1.endDate;
  }
}
