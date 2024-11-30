# Booking System RAG (Recommendations and Guidance)

This document serves as a living knowledge base for code quality standards, best practices, and lessons learned specific to the HexProperty Booking subsystem.

## TypeScript/Next.js Best Practices

### 1. API Route Organization

#### ❌ Wrong Approach
```typescript
// pages/api/booking.ts
export default function handler(req, res) {
  if (req.method === 'POST') {
    // Handle booking creation
  } else if (req.method === 'GET') {
    // Handle booking retrieval
  }
}
```

#### ✅ Correct Approach
```typescript
// src/pages/api/bookings/[id].ts
import { createBookingHandler, getBookingHandler } from '@/application/handlers'

export default function handler(req, res) {
  const handlers = {
    POST: createBookingHandler,
    GET: getBookingHandler,
  }
  return handlers[req.method]?.(req, res) ?? res.status(405).end()
}
```

### 2. Domain Entity Definition

#### ❌ Wrong Approach
```typescript
// Mixing domain logic with infrastructure
class Booking {
  constructor(private db: Database) {}
  
  async save() {
    return this.db.bookings.create(this)
  }
}
```

#### ✅ Correct Approach
```typescript
// Pure domain entity
class Booking {
  constructor(
    private readonly id: BookingId,
    private readonly propertyId: PropertyId,
    private status: BookingStatus
  ) {}
  
  confirm(): Result<void, BookingError> {
    if (this.status !== BookingStatus.Pending) {
      return err(new BookingError('Invalid status transition'))
    }
    this.status = BookingStatus.Confirmed
    return ok(void 0)
  }
}
```

### 3. Error Handling

#### ❌ Wrong Approach
```typescript
try {
  await bookProperty(propertyId, dates)
} catch (e) {
  console.error(e)
  res.status(500).json({ error: 'Something went wrong' })
}
```

#### ✅ Correct Approach
```typescript
try {
  await bookProperty(propertyId, dates)
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: error.message,
      details: error.details
    })
  }
  if (error instanceof BookingError) {
    return res.status(409).json({
      code: error.code,
      message: error.message
    })
  }
  logger.error('Unexpected error during booking', { error, propertyId })
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  })
}
```

### 4. State Management

#### ❌ Wrong Approach
```typescript
// Global mutable state
let currentBooking = null

function updateBooking(data) {
  currentBooking = { ...currentBooking, ...data }
}
```

#### ✅ Correct Approach
```typescript
// Using Zustand with TypeScript
interface BookingStore {
  booking: Booking | null
  setBooking: (booking: Booking) => void
  updateBooking: (data: Partial<Booking>) => void
}

const useBookingStore = create<BookingStore>((set) => ({
  booking: null,
  setBooking: (booking) => set({ booking }),
  updateBooking: (data) => 
    set((state) => ({
      booking: state.booking 
        ? { ...state.booking, ...data }
        : null
    }))
}))
```

### 5. Testing Patterns

#### ❌ Wrong Approach
```typescript
test('booking works', () => {
  const booking = new Booking()
  booking.create()
  expect(booking.status).toBe('confirmed')
})
```

#### ✅ Correct Approach
```typescript
describe('Booking', () => {
  const createValidBooking = () => {
    return BookingBuilder()
      .withProperty(PropertyId.create())
      .withDates(DateRange.create(tomorrow(), dayAfterTomorrow()))
      .build()
  }

  describe('confirm', () => {
    it('should confirm a pending booking', () => {
      const booking = createValidBooking()
      
      const result = booking.confirm()
      
      expect(result.isOk()).toBe(true)
      expect(booking.status).toBe(BookingStatus.Confirmed)
    })

    it('should fail to confirm an already confirmed booking', () => {
      const booking = createValidBooking()
      booking.confirm()
      
      const result = booking.confirm()
      
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBeInstanceOf(BookingError)
    })
  })
})
```

### 6. System Integration Patterns

#### ❌ Wrong Approach
```typescript
// Tightly coupled integration
class BookingService {
  constructor(
    private legacyCalendar: LegacyCalendar,
    private legacyRental: LegacyRental
  ) {}

  async createBooking(data: BookingData) {
    await this.legacyCalendar.book(data)
    await this.legacyRental.updateUnit(data)
  }
}
```

#### ✅ Correct Approach
```typescript
/**
 * Defines a clean interface for legacy system integration
 */
interface LegacySystemPort {
  processBooking(booking: Booking): Promise<Result<void, SystemError>>
}

/**
 * Adapts legacy calendar system to new architecture
 */
class CalendarSystemAdapter implements LegacySystemPort {
  constructor(private readonly calendar: LegacyCalendar) {}

  async processBooking(
    booking: Booking
  ): Promise<Result<void, SystemError>> {
    try {
      const legacyFormat = this.mapToLegacyFormat(booking)
      await this.calendar.book(legacyFormat)
      return ok(void 0)
    } catch (error) {
      return err(new SystemError('Calendar system error', error))
    }
  }
}

/**
 * Manages multiple legacy system integrations
 */
class BookingService {
  constructor(
    private readonly legacySystems: LegacySystemPort[]
  ) {}

  async createBooking(booking: Booking): Promise<Result<void, SystemError>> {
    const results = await Promise.all(
      this.legacySystems.map(system => 
        system.processBooking(booking)
      )
    )
    
    return Result.combine(results)
  }
}
```

### 7. Three-Iteration Development Pattern

#### ❌ Wrong Approach
```typescript
// Jumping straight to implementation
function implementFeature() {
  // Start coding immediately
  // Fix issues as they come up
  // Add tests later
}
```

#### ✅ Correct Approach
```typescript
/**
 * First Iteration: Stop (Analysis)
 */
interface FeatureAnalysis {
  currentState: SystemState
  targetState: SystemState
  gaps: Gap[]
  constraints: Constraint[]
}

/**
 * Second Iteration: Think (Design)
 */
interface FeatureDesign {
  architecture: Architecture
  integrationPoints: IntegrationPoint[]
  dataFlow: DataFlow
  testStrategy: TestStrategy
}

/**
 * Third Iteration: Reiterate (Optimization)
 */
interface FeatureOptimization {
  performance: PerformanceMetrics
  monitoring: MonitoringStrategy
  improvements: Improvement[]
}

/**
 * Feature implementation following three-iteration pattern
 */
class FeatureImplementation {
  /**
   * Analyze current state and requirements
   */
  analyze(): FeatureAnalysis {
    // Perform analysis
    return analysis
  }

  /**
   * Design solution based on analysis
   */
  design(analysis: FeatureAnalysis): FeatureDesign {
    // Create design
    return design
  }

  /**
   * Implement and optimize solution
   */
  implement(design: FeatureDesign): FeatureOptimization {
    // Implement and optimize
    return optimization
  }
}

## Three-Iteration Methodology Decision Documentation

### Current Iteration Decision (2024-01)

#### Analysis
- Examined legacy systems code structure
- Reviewed existing documentation
- Evaluated integration options

#### Decision Matrix
| Option | Impact | Complexity | Value | Priority |
|--------|---------|------------|--------|----------|
| System Deep Dive | High | High | Medium | 2 |
| Technical Assessment | Medium | Medium | Low | 3 |
| Data Model Mapping | High | Medium | High | 1 |

#### Selected Approach: Data Model Mapping
1. **Justification**
   - Provides immediate practical value
   - Essential for integration planning
   - Reduces risk of incompatible data structures

2. **Implementation Plan**
   - Start with availability model (cal system)
   - Map to modern TypeScript interfaces
   - Create adapter patterns for integration

3. **Success Metrics**
   - Complete data model documentation
   - TypeScript type definitions
   - Integration test coverage

## Documentation Standards

### Component Documentation

#### ❌ Wrong Approach
```typescript
// Basic component with no documentation
export const BookingForm = () => {
  // ...component logic
}
```

#### ✅ Correct Approach
```typescript
/**
 * BookingForm handles the property booking process.
 * 
 * @example
 * ```tsx
 * <BookingForm 
 *   propertyId="123"
 *   onSuccess={(booking) => console.log(booking)}
 *   onError={(error) => handleError(error)}
 * />
 * ```
 * 
 * @param props.propertyId - ID of the property to book
 * @param props.onSuccess - Called when booking is successful
 * @param props.onError - Called when booking fails
 */
export const BookingForm: React.FC<BookingFormProps> = ({
  propertyId,
  onSuccess,
  onError
}) => {
  // ...component logic
}
```

## Performance Optimization

### Data Fetching

#### ❌ Wrong Approach
```typescript
// Multiple unnecessary requests
const BookingPage = () => {
  const [property, setProperty] = useState()
  const [prices, setPrices] = useState()
  
  useEffect(() => {
    fetch('/api/property').then(r => setProperty(r))
    fetch('/api/prices').then(r => setPrices(r))
  }, [])
}
```

#### ✅ Correct Approach
```typescript
// Using React Query for efficient data fetching
const BookingPage = () => {
  const { data: property } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getProperty(id)
  })
  
  const { data: prices } = useQuery({
    queryKey: ['prices', id],
    queryFn: () => getPrices(id),
    enabled: !!property // Only fetch prices after property loads
  })
}
```

## Continuous Updates
This document will be updated as new patterns emerge and best practices evolve. When adding new code to the booking system:

1. Check this RAG first for existing patterns
2. If implementing a new pattern, document it here
3. Include concrete examples of both incorrect and correct approaches
4. Keep examples specific to the booking domain
