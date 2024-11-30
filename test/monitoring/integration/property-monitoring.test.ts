import { PropertyMonitoring } from '../../../src/monitoring/examples/property-monitoring';
import { MonitoringFacade } from '../../../src/monitoring/facade/monitoring-facade';
import { HealthStatus } from '../../../src/monitoring/domain/types';

describe('PropertyMonitoring Integration Tests', () => {
    let propertyMonitoring: PropertyMonitoring;
    let monitoringFacade: MonitoringFacade;

    beforeEach(() => {
        propertyMonitoring = new PropertyMonitoring();
        monitoringFacade = MonitoringFacade.getInstance();
    });

    describe('Property Search Monitoring', () => {
        it('should track search performance and metrics', async () => {
            const searchParams = {
                location: 'San Francisco',
                minPrice: 500000,
                maxPrice: 1000000,
                filters: {
                    bedrooms: 2,
                    bathrooms: 2
                }
            };

            await propertyMonitoring.monitorPropertySearch(searchParams);

            // Verify metrics were recorded
            expect(monitoringFacade.getMetricCount('property_search_request')).toBe(1);
            expect(monitoringFacade.getLatestMetric('property_search_latency')).toBeDefined();
        });

        it('should handle and report search errors', async () => {
            const errorSearchParams = {
                location: 'Invalid Location',
                minPrice: -1000, // Invalid price
                maxPrice: 500
            };

            await expect(
                propertyMonitoring.monitorPropertySearch(errorSearchParams)
            ).rejects.toThrow();

            // Verify error was recorded
            expect(monitoringFacade.getErrorCount()).toBe(1);
            expect(monitoringFacade.getLatestHealth('property_search'))
                .toBe(HealthStatus.DEGRADED);
        });
    });

    describe('Recommendation Monitoring', () => {
        it('should track recommendation quality', async () => {
            const userId = 'user123';
            const propertyId = 'prop456';
            const goodScore = 0.85;

            await propertyMonitoring.monitorPropertyRecommendation(
                userId,
                propertyId,
                goodScore
            );

            // Verify metrics
            const metric = monitoringFacade.getLatestMetric('recommendation_score');
            expect(metric.value).toBe(goodScore);
            expect(metric.labels).toEqual({
                user_id: userId,
                property_id: propertyId
            });
        });

        it('should detect low quality recommendations', async () => {
            const lowScore = 0.3;

            await propertyMonitoring.monitorPropertyRecommendation(
                'user123',
                'prop456',
                lowScore
            );

            // Verify health status
            expect(monitoringFacade.getLatestHealth('recommendation_engine'))
                .toBe(HealthStatus.DEGRADED);
        });
    });

    describe('Property View Monitoring', () => {
        it('should track view engagement metrics', async () => {
            const propertyId = 'prop789';
            const userId = 'user456';
            const longDuration = 400; // seconds

            await propertyMonitoring.monitorPropertyView(
                propertyId,
                userId,
                longDuration
            );

            // Verify engagement metrics
            expect(monitoringFacade.getMetricCount('high_engagement_view')).toBe(1);
            expect(monitoringFacade.getLatestMetric('property_view_duration').value)
                .toBe(longDuration);
        });
    });

    describe('Booking Monitoring', () => {
        it('should track successful bookings', async () => {
            await propertyMonitoring.monitorBookingAttempt(
                'prop123',
                'user789',
                true
            );

            const metric = monitoringFacade.getLatestMetric('booking_attempt');
            expect(metric.labels.success).toBe('true');
            expect(monitoringFacade.getLatestHealth('booking_system'))
                .toBe(HealthStatus.HEALTHY);
        });

        it('should detect and report failed bookings', async () => {
            await propertyMonitoring.monitorBookingAttempt(
                'prop123',
                'user789',
                false
            );

            expect(monitoringFacade.getLatestHealth('booking_system'))
                .toBe(HealthStatus.DEGRADED);
        });
    });

    describe('Load Shedding', () => {
        it('should activate load shedding under high load', async () => {
            // Simulate high load
            await monitoringFacade.recordResourceUsage({
                cpu: 90,
                memory: 85,
                requestRate: 1200
            });

            // Verify load shedding is active
            expect(monitoringFacade.isLoadSheddingActive()).toBe(true);
        });
    });

    describe('Metric Aggregation', () => {
        it('should aggregate metrics over time windows', async () => {
            // Record multiple view durations
            const durations = [30, 45, 60, 120];
            for (const duration of durations) {
                await propertyMonitoring.monitorPropertyView(
                    'prop123',
                    'user789',
                    duration
                );
            }

            // Verify aggregation
            const avg = monitoringFacade.getAggregatedMetric(
                'property_view_duration',
                'avg',
                '5m'
            );
            expect(avg).toBe(63.75); // (30 + 45 + 60 + 120) / 4
        });
    });
});
