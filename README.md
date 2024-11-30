# HexProperty Booking System

## 🏠 Project Overview
A comprehensive, domain-driven serverless booking management system designed for modern property management and booking experiences.

## 📚 Documentation Index
1. [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
2. [Domain Model](docs/DOMAIN_MODEL.md)
3. [Development Methodology](docs/DEVELOPMENT_METHODOLOGY.md)
4. [Performance Strategy](docs/PERFORMANCE_STRATEGY.md)
5. [Logging Strategy](docs/LOGGING_STRATEGY.md)
6. [Error Handling Strategy](docs/ERROR_HANDLING_STRATEGY.md)
7. [GraphQL Error Handling](docs/GRAPHQL_ERROR_HANDLING.md)
8. [Distributed Caching Strategy](docs/DISTRIBUTED_CACHING_STRATEGY.md)
9. [Future Roadmap](docs/FUTURE_ROADMAP.md)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- TypeScript
- Redis
- Google Cloud Platform Account

### Installation
```bash
git clone https://github.com/your-org/hexproperty-booking.git
cd hexproperty-booking
npm install
```

### Running the Project
```bash
npm run dev
npm run test
npm run build
```

## 🛠 Tech Stack
- Frontend: Next.js 14
- Backend: TypeScript
- Testing: Vitest
- Validation: Zod
- Logging: Winston
- Caching: Redis
- GraphQL: Apollo
- Deployment: GCP Cloud Run

## 🔐 Security
- Cloud IAP Authentication
- Encrypted data at rest
- Service account per component
- Minimal stack trace exposure

## 📊 Performance Targets
- Booking confirmation: < 2 seconds
- Access control: < 1 second
- System response time: < 1 second
- Availability: > 99.9%
- Error rate: < 0.1%

## 🤝 Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Contact
- Project Lead: [Your Name]
- Email: [your.email@example.com]
- GitHub: [@yourusername]
