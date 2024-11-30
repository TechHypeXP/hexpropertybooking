# Business Process Diagrams

## 1. System Architecture Overview
```mermaid
graph TB
    subgraph "Interface Layer"
        UI[UI Components]
        API[API Gateway]
    end

    subgraph "Application Layer"
        BC[Booking Commands]
        BQ[Booking Queries]
        AC[Availability Commands]
        AQ[Availability Queries]
        CC[Channel Commands]
        CQ[Channel Queries]
    end

    subgraph "Domain Layer"
        BA[Booking Aggregate]
        PA[Property Aggregate]
        CA[Channel Aggregate]
    end

    subgraph "Infrastructure Layer"
        DB[(Database)]
        Cache[(Cache)]
        Queue[Message Queue]
    end

    subgraph "External Systems"
        Cal[Calendar System]
        Rental[Property System]
        Reserve[Reservation System]
        Channels[Channel Partners]
    end

    UI --> API
    API --> BC & BQ & AC & AQ & CC & CQ
    BC & AC & CC --> BA & PA & CA
    BQ & AQ & CQ --> BA & PA & CA
    BA & PA & CA --> DB & Cache
    BA & PA & CA --> Queue
    Queue --> Cal & Rental & Reserve & Channels
```

## 2. Booking Process Flow
```mermaid
stateDiagram-v2
    [*] --> SearchAvailability
    SearchAvailability --> PropertySelection
    PropertySelection --> DateSelection
    DateSelection --> AvailabilityCheck
    
    state AvailabilityCheck {
        [*] --> CheckCache
        CheckCache --> CheckDatabase
        CheckDatabase --> CheckChannels
        CheckChannels --> UpdateCache
        UpdateCache --> [*]
    }
    
    AvailabilityCheck --> PriceCalculation
    PriceCalculation --> GuestDetails
    GuestDetails --> PaymentProcessing
    
    state PaymentProcessing {
        [*] --> ValidatePayment
        ValidatePayment --> ProcessPayment
        ProcessPayment --> UpdateBooking
        UpdateBooking --> [*]
    }
    
    PaymentProcessing --> ConfirmBooking
    ConfirmBooking --> NotifyStakeholders
    NotifyStakeholders --> [*]
```

## 3. Data Flow Architecture
```mermaid
graph LR
    subgraph "Data Sources"
        Cal[(Calendar DB)]
        Rental[(Property DB)]
        Reserve[(Reservation DB)]
    end

    subgraph "Data Integration"
        ETL[ETL Process]
        Sync[Sync Service]
        Val[Validation]
    end

    subgraph "Data Storage"
        Main[(Main DB)]
        Cache[(Redis Cache)]
        Event[(Event Store)]
    end

    Cal & Rental & Reserve --> ETL
    ETL --> Val
    Val --> Main
    Main --> Cache
    Main --> Event
    Event --> Sync
    Sync --> Cal & Rental & Reserve
```

## 4. Channel Integration Sequence
```mermaid
sequenceDiagram
    participant C as Channel Manager
    participant B as Booking Service
    participant P as Property Service
    participant Q as Message Queue
    participant E as External Channels

    C->>B: Check Availability
    B->>P: Get Property Status
    P->>Q: Publish Status Check
    Q->>E: Query Channel Status
    E-->>Q: Channel Response
    Q-->>P: Update Status
    P-->>B: Property Available
    B-->>C: Availability Confirmed

    C->>B: Create Booking
    B->>P: Update Property
    P->>Q: Publish Booking
    Q->>E: Update Channels
    E-->>Q: Confirmation
    Q-->>P: Update Complete
    P-->>B: Booking Created
    B-->>C: Booking Confirmed
```

## 5. Integration Layer Architecture
```mermaid
graph TB
    subgraph "New System"
        API[API Gateway]
        CMD[Command Bus]
        EVT[Event Bus]
    end

    subgraph "Integration Layer"
        direction TB
        subgraph "Adapters"
            CA[Calendar Adapter]
            RA[Rental Adapter]
            RSA[Reserve Adapter]
        end
        
        subgraph "Ports"
            BP[Booking Port]
            PP[Property Port]
            CP[Channel Port]
        end
        
        subgraph "Transformers"
            BT[Booking Transformer]
            PT[Property Transformer]
            CT[Channel Transformer]
        end
    end

    subgraph "Legacy Systems"
        Cal[Calendar System]
        Rental[Property System]
        Reserve[Reservation System]
    end

    API --> CMD
    CMD --> BP & PP & CP
    BP --> CA & RA & RSA
    PP --> RA
    CP --> RSA
    CA & RA & RSA --> BT & PT & CT
    BT & PT & CT --> Cal & Rental & Reserve
    Cal & Rental & Reserve --> EVT
```

## 6. Legacy Systems Analysis
```mermaid
graph TD
    subgraph "HexProperty tab"
        direction TB
        T1[Modern UI Components]
        T2[TypeScript/Next.js Stack]
        T3[State Management]
        T4[API Integration Patterns]
    end
    
    subgraph "HexProperty reserve"
        direction TB
        RS1[Advanced Booking Engine]
        RS2[Multi-Channel Management]
        RS3[Owner Portal & Reporting]
        RS4[Rate Management]
    end
    
    subgraph "HexProperty rental"
        direction TB
        R1[Property Management]
        R2[Unit & Inventory Control]
        R3[Tenant Management]
        R4[Billing & Invoicing]
    end
    
    subgraph "HexProperty cal"
        direction TB
        C1[Availability Engine]
        C2[Calendar Management]
        C3[Basic Booking Logic]
        C4[Schedule Optimization]
    end

    subgraph "New Booking System"
        direction TB
        UI[UI Layer]
        BL[Business Logic]
        DL[Data Layer]
    end

    T1 & T2 & T3 & T4 --> UI
    RS1 & RS2 & C1 & C2 --> BL
    R1 & R2 & RS3 & RS4 --> DL
```

### Component Inheritance Map

| Source System | Components to Inherit | Justification |
|---------------|---------------------|----------------|
| HexProperty tab | - Modern UI Components<br>- TypeScript/Next.js Stack<br>- State Management<br>- API Integration | Most recent tech stack, provides modern foundation |
| HexProperty reserve | - Advanced Booking Engine<br>- Multi-Channel Management<br>- Owner Portal & Reporting<br>- Rate Management | Most comprehensive booking functionality |
| HexProperty rental | - Property Management<br>- Unit & Inventory Control<br>- Tenant Management<br>- Billing & Invoicing | Core property management features |
| HexProperty cal | - Availability Engine<br>- Calendar Management<br>- Basic Booking Logic<br>- Schedule Optimization | Proven calendar and availability system |

### First Iteration Strategy
1. **Direct Component Copy**
   - Copy components with minimal modifications
   - Maintain existing business logic
   - Preserve proven workflows

2. **Integration Points**
   ```mermaid
   graph LR
       subgraph "Phase 1: Direct Copy"
           A[Copy Components] --> B[Verify Functionality]
           B --> C[Document Behavior]
       end
       
       subgraph "Phase 2: Integration"
           D[Connect Systems] --> E[Test Integration]
           E --> F[Validate Workflows]
       end
       
       C --> D
   ```

3. **Validation Strategy**
   - Test each component in isolation
   - Verify business logic accuracy
   - Ensure data consistency
   - Maintain existing APIs

## 7. Complete Implementation Roadmap

### Phase 1: Core Booking Infrastructure
1. **Availability Management** 
   - Cache implementation
   - Real-time checking
   - Channel synchronization
   - Conflict resolution

2. **Property Management**
   - Property data model
   - Unit management
   - Pricing rules
   - Availability rules

3. **Booking Process**
   - Booking creation
   - Status management
   - Modification handling
   - Cancellation process

### Phase 2: Channel Integration
1. **Channel Management**
   - Channel adapter framework
   - Data synchronization
   - Rate management
   - Inventory distribution

2. **External Systems**
   - Legacy system integration
   - API implementations
   - Data migration
   - Sync validation

### Phase 3: User Experience
1. **Booking Interface**
   - Search implementation
   - Booking workflow
   - Payment integration
   - Confirmation process

2. **Property Interface**
   - Property management
   - Calendar management
   - Rate management
   - Channel distribution

### Phase 4: Optimization
1. **Performance**
   - Caching strategy
   - Query optimization
   - Load balancing
   - Response time

2. **Scalability**
   - Horizontal scaling
   - Data partitioning
   - Event sourcing
   - CQRS implementation

### Phase 5: Analytics & Reporting
1. **Business Intelligence**
   - Booking analytics
   - Revenue management
   - Channel performance
   - Market analysis

2. **Operational Metrics**
   - System health
   - Performance metrics
   - Error tracking
   - Usage patterns
