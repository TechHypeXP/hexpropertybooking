/**
 * Maps between legacy Cal system and new domain models
 * @package HexProperty
 */

import { LegacyAvailabilityResponse, LegacyDateRange } from './types';
import { AvailabilityStatus, DateRange } from '../../../domain/availability/types';

export class LegacyCalMapper {
  /**
   * Maps legacy response to domain model
   */
  static toDomain(legacy: LegacyAvailabilityResponse): AvailabilityStatus {
    return {
      isAvailable: legacy.availability > 0,
      availableUnits: legacy.availability,
      restrictions: []
    };
  }

  /**
   * Maps domain model to legacy format
   */
  static toLegacy(domain: DateRange): Partial<LegacyDateRange> {
    return {
      date_start: domain.startDate.toISOString().split('T')[0],
      date_end: domain.endDate.toISOString().split('T')[0]
    };
  }
}
