# Booking System Deployment Guide

## Infrastructure Setup

### 1. Core Services
```yaml
services:
  booking-service:
    image: hexbooking/booking:${VERSION}
    env:
      - DB_CONNECTION=
      - REDIS_URL=
      - API_KEY=

  availability-service:
    image: hexbooking/availability:${VERSION}
    env:
      - CACHE_URL=
      - SYNC_INTERVAL=
```

### 2. Database Migration
```bash
# Version control for schema
migrate up --env production

# Data verification
verify-migration --tables bookings,properties
```

## Monitoring Setup
- Prometheus metrics
- Grafana dashboards
- Error tracking
- Performance monitoring

## Rollback Procedures
1. Database rollback steps
2. Service version rollback
3. Cache invalidation
4. Channel resync
