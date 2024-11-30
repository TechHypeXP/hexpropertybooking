# Booking System Coding Standards

## TypeScript Guidelines

### 1. Type Definitions
```typescript
// Domain Types
type PropertyId = string;
type ReservationId = string;

// Use specific types, not general ones
interface Property {
    id: PropertyId;
    name: string;
    location: Location;
    amenities: Amenity[];
}
```

### 2. Function Signatures
```typescript
// Use explicit return types
async function createReservation(
    propertyId: PropertyId,
    dates: DateRange
): Promise<Reservation>

// Use type guards
function isValidReservation(obj: unknown): obj is Reservation {
    // Type checking logic
}
```

### 3. Error Handling
```typescript
// Define custom errors
class ReservationError extends Error {
    constructor(message: string, public code: string) {
        super(message);
    }
}

// Use async/await with proper error handling
try {
    await createReservation(propertyId, dates);
} catch (error) {
    if (error instanceof ReservationError) {
        // Handle domain error
    }
    // Handle other errors
}
```

## Project Structure
```
/src
  /domain          // Business logic
  /application    // Use cases
  /infrastructure // External services
  /interface      // API/UI layer
```

## Testing Requirements
- Unit tests for all business logic
- Integration tests for APIs
- E2E tests for critical flows
- 80%+ coverage requirement
