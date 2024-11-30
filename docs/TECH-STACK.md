# HexProperty Tech Stack Specification
Version: 1.0.0
Last Updated: 2024-01-10

## Primary Stack (GCP-Based)

### Infrastructure Layer
- **Container Platform:** Google Cloud Run
- **Functions:** Google Cloud Functions
- **Service Mesh:** Google Cloud Service Mesh (Istio)
- **API Gateway:** Google Cloud API Gateway
- **Event Bus:** Google Cloud Pub/Sub
- **Database:** Google Cloud Bigtable
- **Cache:** Google Cloud Memorystore
- **Monitoring:** Google Stackdriver

### Development Layer
- **Frontend Framework:** Next.js 14 (App Router)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **State Management:**
  - UI State: Zustand
  - Server State: React Query
  - Domain State: Event Sourcing
- **Type Safety:** TypeScript
- **API:** GraphQL (Primary), REST (Legacy)
- **Testing:**
  - Unit: Jest
  - E2E: Cypress
  - Performance: Lighthouse
  - Accessibility: axe-core

## Secondary Stack (Container-Based)

### Infrastructure Layer
- **Container Platform:** Docker
- **API Gateway:** Kong
- **Service Mesh:** Linkerd
- **Event Bus:** Apache Kafka
- **Database:** PostgreSQL
- **Cache:** Redis
- **Monitoring:** Prometheus + Grafana

### Development Layer
- **Backend Framework:** FastAPI
- **ORM:** Gino
- **API Documentation:** GraphiQL/Swagger
- **Error Tracking:** Sentry

## Cross-Cutting Tools

### Documentation
- **API Docs:** TypeDoc
- **GraphQL Docs:** GraphiQL
- **Project Docs:** Docusaurus

### CI/CD & DevOps
- **IaC:** Terraform
- **CI/CD:** GitHub Actions
- **Container Registry:** Google Container Registry
- **Secret Management:** Google Secret Manager

### Monitoring & Observability
- **Logging:** Google Cloud Logging
- **Tracing:** OpenTelemetry
- **APM:** Google Cloud Trace
- **Error Tracking:** Sentry
- **RUM:** Google Analytics

### Security
- **Authentication:** Google Cloud IAP
- **Authorization:** Custom RBAC
- **API Security:** OAuth 2.0 + JWT
- **Secrets:** Google Cloud KMS

## Development Standards

### Code Quality
- **Linting:** ESLint
- **Formatting:** Prettier
- **Git Hooks:** Husky
- **Commit Format:** Conventional Commits

### Architecture Patterns
- **Frontend:** Micro-frontends (Module Federation)
- **Backend:** Microservices
- **State:** CQRS + Event Sourcing
- **API:** API-First Design
- **Testing:** TDD/BDD

### Performance Targets
- **Page Load:** < 2s
- **API Response:** < 200ms
- **TBT:** < 300ms
- **FCP:** < 1.5s
- **LCP:** < 2.5s

## Deployment Environments

### Development
- Feature branches
- Local development
- Integration testing

### Staging
- Release candidates
- Performance testing
- Security testing

### Production
- Blue/Green deployment
- Canary releases
- A/B testing support
