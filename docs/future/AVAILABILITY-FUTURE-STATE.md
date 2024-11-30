# Future State: Availability System
Version: 1.0.0
Last Updated: 2024-01-10

## Current vs Future State

### Current (Legacy Cal System)
- Room-based availability
- Simple channel management
- Basic booking restrictions
- Direct database queries

### Future State
- Apartment-based availability
- Zone/compound aware
- Broker pool integration
- HiVision access control
- GraphQL API
- Event-driven updates

## Implementation Phases

### Phase 1: Legacy Mapping
- Create exact TypeScript types
- Implement legacy adapters
- Maintain existing business logic

### Phase 2: New Features
- Add broker management
- Integrate HiVision
- Implement zone control
- Add owner notifications

### Phase 3: Migration
- Switch to new domain model
- Implement GraphQL API
- Add event sourcing
- Enable real-time updates

## Technology Stack
(To be filled after PDF review)

## Integration Points
1. HiVision Access Control
   - Face recognition
   - QR code generation
   - Gate control

2. SMS Gateway
   - Owner notifications
   - Broker alerts

3. Property Master System
   - Location hierarchy
   - Zone management
   - Broker pools
