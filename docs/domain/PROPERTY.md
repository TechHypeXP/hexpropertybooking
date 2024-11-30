# Property Domain Documentation
Version: 1.0.0
Last Updated: 2024-01-15

## Domain Overview

The Property domain represents the physical structure hierarchy of properties within the HexProperty Booking system.

### Core Concepts

1. **Property**
   - Atomic unit of booking
   - Contains physical attributes (bedrooms, floor, unit)
   - Belongs to a Building

2. **Building**
   - Aggregate root for Properties
   - Manages property collection
   - Belongs to a Zone
   - Enforces property ownership

3. **Zone**
   - Groups Buildings
   - Contains public facilities
   - Manages access rules

4. **Compound**
   - Groups Zones
   - Part of a Location
   - Organizational unit

5. **Location**
   - Top-level geographical entity
   - Contains Compounds
   - Root of property hierarchy

## Implementation Details

### Type Safety

1. **Branded Types**
   ```typescript
   type PropertyId = string & { readonly _brand: unique symbol };
   type BuildingId = string & { readonly _brand: unique symbol };
   type ZoneId = string & { readonly _brand: unique symbol };
   ```

2. **Zod Validation**
   ```typescript
   const PropertySchema = z.object({
     id: PropertyIdSchema,
     buildingId: BuildingIdSchema,
     bedrooms: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
     floor: z.number().int().min(0),
     unit: z.string().min(1)
   });
   ```

### Domain Rules

1. **Property**
   - Must have valid building reference
   - Floor number must be non-negative
   - Unit number must be non-empty
   - Bedrooms must be 1-4

2. **Building**
   - Must have unique name within zone
   - Can contain multiple properties
   - Properties must belong to building

3. **Zone**
   - Can have public facilities
   - Can define access rules
   - Must belong to compound

## Value Objects

### TimeRestriction
```typescript
interface TimeRestriction {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}
```

### AccessRule
```typescript
interface AccessRule {
  facilityId: string;
  allowedZones: ZoneId[];
  timeRestrictions?: TimeRestriction;
}
```

## Aggregate Boundaries

1. **Property Aggregate**
   - Root: Building
   - Entities: Property
   - Value Objects: None

2. **Zone Aggregate**
   - Root: Zone
   - Entities: Building
   - Value Objects: PublicFacility, AccessRule

3. **Location Aggregate**
   - Root: Location
   - Entities: Compound, Zone
   - Value Objects: None

## Domain Events

1. **PropertyCreated**
2. **PropertyUpdated**
3. **BuildingCreated**
4. **ZoneAccessRuleAdded**

## Test Coverage

1. **Unit Tests**
   - Entity creation validation
   - Business rule enforcement
   - Aggregate consistency

2. **Integration Tests**
   - Property hierarchy navigation
   - Access rule evaluation
   - Facility management

## Performance Considerations

1. **Caching Strategy**
   - Cache property hierarchy
   - Cache access rules
   - Cache facility availability

2. **Query Optimization**
   - Denormalize property data
   - Index by common search fields
   - Optimize hierarchy traversal

## Security

1. **Access Control**
   - Zone-based access rules
   - Time-based restrictions
   - Role-based permissions

2. **Data Protection**
   - Encrypted property data
   - Audit logging
   - Access tracking

## Version History

| Version | Date       | Changes                          |
|---------|------------|----------------------------------|
| 1.0.0   | 2024-01-15| Initial domain implementation    |
