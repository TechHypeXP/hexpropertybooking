# HexProperty Booking Subsystem - Serverless Deployment Guide (Staging)
Version: 1.0.0
Last Updated: 2024-01-10 14:45:23 GMT+2

## Overview
This guide details the serverless deployment configuration for the HexProperty Booking subsystem, optimized for staging environment with low concurrency (max 5-6 concurrent requests).

## Infrastructure Components

### Cloud Run Services
| Service | Min Instances | Max Instances | Memory | CPU | Max Concurrency |
|---------|---------------|---------------|---------|-----|-----------------|
| Booking-Frontend | 0 | 2 | 256Mi | 0.5 | 6 |
| Availability-API | 0 | 2 | 256Mi | 0.5 | 6 |
| Reservation-API | 0 | 2 | 256Mi | 0.5 | 6 |
| Access-Control-API | 0 | 2 | 256Mi | 0.5 | 6 |

### Cloud Functions
| Function | Memory | Timeout | Type | Trigger |
|----------|---------|----------|------|---------|
| availability-check | 256MB | 60s | HTTP | HTTP |
| booking-processor | 256MB | 120s | Event | Pub/Sub |
| access-token-gen | 256MB | 60s | HTTP | HTTP |
| notification-sender | 256MB | 60s | Event | Pub/Sub |

### Managed Services
| Service | Type | Tier | Size |
|---------|------|------|------|
| Cloud SQL | PostgreSQL | db-f1-micro | 10GB |
| Memorystore | Redis | Basic | 1GB |
| Cloud Storage | Standard | - | Pay per use |
| Pub/Sub | Standard | - | Pay per use |

## Deployment Configurations

### Frontend Service (Cloud Run)
```yaml
service: booking-frontend
runtime: nodejs16
instance_class: F1

automatic_scaling:
  min_instances: 0
  max_instances: 2
  target_cpu_utilization: 0.7
  max_concurrent_requests: 6

resources:
  cpu: 0.5
  memory_gb: 0.25
  disk_size_gb: 10

env_variables:
  NODE_ENV: "staging"
  API_URL: "https://booking-api-staging.hexproperty.com"
```

### Availability API (Cloud Run)
```yaml
service: availability-api
runtime: nodejs16
instance_class: F1

automatic_scaling:
  min_instances: 0
  max_instances: 2
  target_cpu_utilization: 0.7
  max_concurrent_requests: 6

resources:
  cpu: 0.5
  memory_gb: 0.25
  disk_size_gb: 10

env_variables:
  NODE_ENV: "staging"
  DB_SOCKET: "/cloudsql/[instance-connection-name]"
  REDIS_URL: "redis://10.0.0.1:6379"
```

### Event Processing Functions
```yaml
runtime: nodejs16
entry_point: processEvent
memory: 256MB
timeout: 60s
environment_variables:
  NODE_ENV: "staging"
```

## Cost Estimation (Monthly)

### Cloud Run Costs
| Service | Requests/Month | Compute Time | Est. Cost |
|---------|---------------|--------------|-----------|
| Booking Frontend | 5000 | 25h | $3-5 |
| Availability API | 3000 | 15h | $2-4 |
| Reservation API | 2000 | 10h | $1-3 |
| Access Control API | 1000 | 5h | $1-2 |
Total Cloud Run: $7-14/month

### Cloud Functions Costs
| Type | Invocations | Compute Time | Est. Cost |
|------|-------------|--------------|-----------|
| HTTP Functions | 10000 | 15h | $2-4 |
| Event Functions | 5000 | 10h | $1-3 |
Total Functions: $3-7/month

### Managed Services
| Service | Usage | Est. Cost |
|---------|-------|-----------|
| Cloud SQL | Minimal | $7/month |
| Memorystore | Basic | $8/month |
| Cloud Storage | < 1GB | $1/month |
| Pub/Sub | < 10GB | $1/month |
Total Services: $17/month

Total Estimated Monthly Cost: $27-38

## Deployment Process

### Initial Setup
1. Create GCP project
2. Enable required APIs
3. Set up service accounts
4. Configure VPC and networking

### Service Deployment
1. Build and push container images
2. Deploy Cloud Run services
3. Deploy Cloud Functions
4. Configure managed services

### Post-Deployment
1. Verify service health
2. Configure monitoring
3. Test end-to-end flows
4. Set up alerts

## Monitoring Setup

### Metrics Collection
1. Request latency
2. Error rates
3. Instance count
4. Cold start frequency

### Logging
1. Structured logging
2. Error tracking
3. Audit logging

### Alerts
1. Service health
2. Error thresholds
3. Cost controls
4. Performance degradation
