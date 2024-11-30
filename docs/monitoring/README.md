# HexProperty Monitoring System

A comprehensive monitoring system for the HexProperty Booking platform, providing real-time insights, alerts, and performance optimization.

## Architecture

The monitoring system follows a hexagonal architecture with domain-driven design principles:

```
src/monitoring/
├── domain/          # Domain-specific monitoring
├── providers/       # Monitoring providers
├── advanced/        # Advanced features
└── infrastructure/  # Infrastructure code
```

## Features

- 🔍 Real-time monitoring
- 📊 Performance optimization
- 🚨 Intelligent alerting
- 📈 Metric aggregation
- 🔐 Security-first design

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run tests:
```bash
npm run test:monitoring
```

4. Deploy:
```bash
./scripts/deploy-monitoring.sh <project-id> <environment>
```

## Development

### Testing

Run the test suite:
```bash
npm run test:monitoring
```

View coverage:
```bash
npm run test:monitoring:coverage
```

### Local Development

Start the monitoring service locally:
```bash
npm run dev:monitoring
```

### Deployment

The system supports multiple environments:

- Staging: Automatic deployment on main branch
- Production: Deployment on version tags (v*)

## Architecture Details

### Domain Monitors

- PropertyMonitor: Property-related metrics
- RecommendationMonitor: ML model performance
- BookingMonitor: Booking process metrics
- TenantMonitor: User interaction metrics

### Monitoring Providers

- Stackdriver (Primary)
- Prometheus (Secondary)

### Advanced Features

- MetricBatchProcessor: Efficient metric processing
- AlertManager: Intelligent alerting system
- MonitoringOptimizer: Performance optimization

## Security

- RBAC access control
- Encrypted metrics
- Secure communication
- Regular security scans

## Best Practices

1. Always use domain-specific monitors
2. Implement proper error handling
3. Follow the monitoring hierarchy
4. Use appropriate metric types
5. Set meaningful alert thresholds

## Troubleshooting

Common issues and solutions:

1. High latency:
   - Check batch processor configuration
   - Verify network connectivity
   - Review metric volume

2. Missing metrics:
   - Verify provider configuration
   - Check monitoring hooks
   - Review log levels

3. False alerts:
   - Adjust alert thresholds
   - Review correlation rules
   - Check metric aggregation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Create a pull request

## License

Copyright © 2023 HexProperty. All rights reserved.
