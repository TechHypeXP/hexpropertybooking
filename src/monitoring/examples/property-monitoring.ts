import { MonitoringFacade } from '../facade/monitoring-facade';
import { HealthStatus } from '../domain/types';

export class PropertyMonitoring {
    private monitoring: MonitoringFacade;

    constructor() {
        this.monitoring = MonitoringFacade.getInstance();
        this.setupMetricAggregations();
    }

    private setupMetricAggregations(): void {
        // Configure property-specific metric aggregations
        this.monitoring.configureAggregation(
            'property_view_count',
            'sum',
            300000, // 5-minute window
            { labels: ['property_id', 'user_type'] }
        );

        this.monitoring.configureAggregation(
            'property_search_latency',
            'percentile',
            60000, // 1-minute window
            { percentile: 95 }
        );

        this.monitoring.configureAggregation(
            'recommendation_accuracy',
            'avg',
            3600000, // 1-hour window
            { labels: ['model_version'] }
        );
    }

    async monitorPropertySearch(searchParams: any): Promise<void> {
        const span = this.monitoring.startOperation('property_search');
        
        try {
            // Add search context to trace
            this.monitoring.tracer.addAttribute(span, 'search_location', searchParams.location);
            this.monitoring.tracer.addAttribute(span, 'price_range', `${searchParams.minPrice}-${searchParams.maxPrice}`);

            await this.monitoring.recordMetric({
                name: 'property_search_request',
                value: 1,
                timestamp: Date.now(),
                labels: {
                    location: searchParams.location,
                    filters: JSON.stringify(searchParams.filters)
                }
            });

        } catch (error) {
            await this.monitoring.recordError(error as Error, {
                operation: 'property_search',
                params: searchParams
            });
            throw error;
        } finally {
            await this.monitoring.endOperation(span);
        }
    }

    async monitorPropertyRecommendation(userId: string, propertyId: string, score: number): Promise<void> {
        const span = this.monitoring.startOperation('property_recommendation');

        try {
            await this.monitoring.recordMetric({
                name: 'recommendation_score',
                value: score,
                timestamp: Date.now(),
                labels: {
                    user_id: userId,
                    property_id: propertyId
                }
            });

            // Monitor recommendation quality
            if (score < 0.5) {
                await this.monitoring.recordHealth(
                    'recommendation_engine',
                    HealthStatus.DEGRADED,
                    `Low recommendation score (${score}) for user ${userId}`
                );
            }

        } finally {
            await this.monitoring.endOperation(span);
        }
    }

    async monitorPropertyView(propertyId: string, userId: string, viewDuration: number): Promise<void> {
        const span = this.monitoring.startOperation('property_view');

        try {
            await Promise.all([
                this.monitoring.recordMetric({
                    name: 'property_view_count',
                    value: 1,
                    timestamp: Date.now(),
                    labels: {
                        property_id: propertyId,
                        user_id: userId
                    }
                }),
                this.monitoring.recordMetric({
                    name: 'property_view_duration',
                    value: viewDuration,
                    timestamp: Date.now(),
                    labels: {
                        property_id: propertyId
                    }
                })
            ]);

            // Monitor engagement quality
            if (viewDuration > 300) { // More than 5 minutes
                await this.monitoring.recordMetric({
                    name: 'high_engagement_view',
                    value: 1,
                    timestamp: Date.now(),
                    labels: {
                        property_id: propertyId
                    }
                });
            }

        } catch (error) {
            await this.monitoring.recordError(error as Error, {
                operation: 'property_view',
                property_id: propertyId,
                user_id: userId
            });
        } finally {
            await this.monitoring.endOperation(span);
        }
    }

    async monitorBookingAttempt(propertyId: string, userId: string, success: boolean): Promise<void> {
        const span = this.monitoring.startOperation('property_booking');

        try {
            await this.monitoring.recordMetric({
                name: 'booking_attempt',
                value: 1,
                timestamp: Date.now(),
                labels: {
                    property_id: propertyId,
                    user_id: userId,
                    success: success.toString()
                }
            });

            if (!success) {
                await this.monitoring.recordHealth(
                    'booking_system',
                    HealthStatus.DEGRADED,
                    `Failed booking attempt for property ${propertyId}`
                );
            }

        } finally {
            await this.monitoring.endOperation(span);
        }
    }
}
