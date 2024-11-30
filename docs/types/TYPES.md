# HexProperty Booking System - Type System Documentation

## Overview
This document outlines the type system architecture for the HexProperty Booking System, focusing on type centralization, legacy system integration, and domain model type safety.

## Type System Architecture

### Directory Structure
```
src/
├── types/
│   ├── index.ts           # Root type exports
│   ├── common/            # Shared utility types
│   ├── domain/           # Domain model types
│   ├── legacy/           # Legacy system types
│   └── api/              # API interface types
```

### Legacy System Integration
The system integrates with four primary legacy systems:

1. **CAL System** (`types/legacy/cal.ts`)
   - Calendar management
   - Availability tracking
   - Date range handling

2. **Reserve System** (`types/legacy/reserve.ts`)
   - Booking management
   - Guest information
   - Reservation status tracking

3. **Rental System** (`types/legacy/rental.ts`)
   - Property management
   - Owner information
   - Property features

4. **Tab System** (`types/legacy/tab.ts`)
   - UI state management
   - Booking form data
   - View preferences

## Type Safety Measures

### Runtime Validation
- All types are defined using Zod schemas
- Runtime type checking at system boundaries
- Automatic type inference from schemas

### Compile-Time Safety
- TypeScript strict mode enabled
- No implicit any
- Strict null checks

## Best Practices

### Type Definition
1. Define Zod schema first
2. Export schema constant
3. Export inferred TypeScript type
4. Document with JSDoc comments

Example:
```typescript
// 1. Zod schema definition
export const PropertySchema = z.object({...});

// 2. Type inference
export type Property = z.infer<typeof PropertySchema>;
```

### Type Usage
1. Import from centralized location
2. Use type-safe constructors
3. Validate at system boundaries
4. Handle type conversions explicitly

## Legacy System Type Mapping

### CAL → Domain
```typescript
CalDateRange → DateRange
CalAvailability → Availability
```

### Reserve → Domain
```typescript
ReserveBooking → Booking
ReserveGuest → Guest
```

### Rental → Domain
```typescript
RentalProperty → Property
RentalOwner → Owner
```

### Tab → Domain
```typescript
TabUIState → UIState
TabBookingForm → BookingForm
```

## Version History

| Version | Date       | Changes                          |
|---------|------------|----------------------------------|
| 1.0.0   | 2024-01-15| Initial type system architecture |

## Related Documentation
- [Domain Model Documentation](../domain/DOMAIN.md)
- [API Documentation](../api/API.md)
- [Testing Strategy](../testing/TESTING.md)
