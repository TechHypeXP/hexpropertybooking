# HexProperty Booking System - Best Practices RAG

## Type System Best Practices

### Centralization
✅ **DO** Centralize all types in the `src/types` directory
❌ **DON'T** Define types in individual domain or feature folders

```typescript
// Good
import { Availability } from '@/types/domain/availability';

// Bad
import { Availability } from '@/domain/availability/types';
```

### Legacy Integration
✅ **DO** Use explicit type mapping between legacy and domain types
❌ **DON'T** Mix legacy and domain types in business logic

```typescript
// Good
const toDomainAvailability = (cal: CalAvailability): Availability => {...}

// Bad
function processAvailability(availability: CalAvailability | Availability) {...}
```

### Validation
✅ **DO** Use Zod for runtime validation
❌ **DON'T** Trust external data without validation

```typescript
// Good
const validated = AvailabilitySchema.parse(externalData);

// Bad
const availability = externalData as Availability;
```

## Domain Model Best Practices

### Entity Design
✅ **DO** Use immutable properties and factory methods
❌ **DON'T** Allow direct property modification

```typescript
// Good
class Availability {
  private constructor(readonly props: AvailabilityProps) {}
  static create(props: AvailabilityProps): Availability {...}
}

// Bad
class Availability {
  public props: AvailabilityProps;
  constructor(props: AvailabilityProps) {
    this.props = props;
  }
}
```

### Business Logic
✅ **DO** Encapsulate business rules in domain entities
❌ **DON'T** Leak business logic to services or controllers

```typescript
// Good
class Booking {
  canBeCancelled(): boolean {
    return this.status !== 'COMPLETED' && 
           this.startDate > new Date();
  }
}

// Bad
class BookingService {
  canBookingBeCancelled(booking: Booking): boolean {
    return booking.status !== 'COMPLETED' && 
           booking.startDate > new Date();
  }
}
```

## Testing Best Practices

### Type Testing
✅ **DO** Test type validation edge cases
❌ **DON'T** Skip runtime type validation tests

```typescript
// Good
it('should reject invalid date format', () => {
  expect(() => DateRangeSchema.parse({
    start: 'invalid'
  })).toThrow();
});

// Bad
it('should handle dates', () => {
  const range = new DateRange('2024-01-01', '2024-01-05');
  expect(range).toBeDefined();
});
```

### Integration Testing
✅ **DO** Test legacy system integration points
❌ **DON'T** Mock entire legacy systems

```typescript
// Good
it('should map legacy availability to domain', async () => {
  const legacy = mockCalSystem.getAvailability('prop1');
  const domain = await availabilityAdapter.toDomain(legacy);
  expect(domain).toBeInstanceOf(Availability);
});

// Bad
it('should handle availability', () => {
  const availability = new Availability({...});
  expect(availability.isAvailable()).toBe(true);
});
```

## Version History

| Version | Date       | Changes                    |
|---------|------------|----------------------------|
| 1.0.0   | 2024-01-15| Initial best practices RAG |
