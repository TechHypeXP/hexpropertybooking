import { Monitor } from '../core/monitor';
import { Metric, HealthStatus } from '../domain/types';

interface AnomalyConfig {
    windowSize: number;
    deviationThreshold: number;
    minDataPoints: number;
}

export class AnomalyDetector {
    private static instance: AnomalyDetector;
    private monitor: Monitor;
    private metricHistory: Map<string, number[]> = new Map();
    private configs: Map<string, AnomalyConfig> = new Map();

    private constructor() {
        this.monitor = Monitor.getInstance();
        this.initializeConfigs();
    }

    static getInstance(): AnomalyDetector {
        if (!AnomalyDetector.instance) {
            AnomalyDetector.instance = new AnomalyDetector();
        }
        return AnomalyDetector.instance;
    }

    async analyzeMetric(metric: Metric): Promise<void> {
        const history = this.getOrCreateHistory(metric.name);
        history.push(metric.value);

        const config = this.configs.get(metric.name) || this.configs.get('default')!;
        
        if (history.length > config.windowSize) {
            history.shift();
        }

        if (history.length >= config.minDataPoints) {
            const isAnomaly = this.detectAnomaly(metric.value, history, config);
            if (isAnomaly) {
                await this.reportAnomaly(metric);
            }
        }
    }

    private initializeConfigs(): void {
        // Default configuration
        this.configs.set('default', {
            windowSize: 100,
            deviationThreshold: 3,
            minDataPoints: 30
        });

        // Specific configurations for different metric types
        this.configs.set('latency', {
            windowSize: 60,
            deviationThreshold: 2.5,
            minDataPoints: 20
        });

        this.configs.set('error_rate', {
            windowSize: 50,
            deviationThreshold: 2,
            minDataPoints: 15
        });

        this.configs.set('memory_usage', {
            windowSize: 120,
            deviationThreshold: 3.5,
            minDataPoints: 40
        });
    }

    private getOrCreateHistory(metricName: string): number[] {
        if (!this.metricHistory.has(metricName)) {
            this.metricHistory.set(metricName, []);
        }
        return this.metricHistory.get(metricName)!;
    }

    private detectAnomaly(
        currentValue: number,
        history: number[],
        config: AnomalyConfig
    ): boolean {
        const { mean, stdDev } = this.calculateStats(history);
        const zScore = Math.abs((currentValue - mean) / stdDev);
        return zScore > config.deviationThreshold;
    }

    private calculateStats(values: number[]): { mean: number; stdDev: number } {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return { mean, stdDev };
    }

    private async reportAnomaly(metric: Metric): Promise<void> {
        const anomalyMetric: Metric = {
            name: `${metric.name}_anomaly`,
            value: metric.value,
            timestamp: Date.now(),
            labels: {
                ...metric.labels,
                type: 'anomaly'
            }
        };

        await Promise.all([
            this.monitor.recordMetric(anomalyMetric),
            this.monitor.recordHealth(
                metric.name,
                HealthStatus.DEGRADED,
                `Anomaly detected in ${metric.name}: ${metric.value}`
            )
        ]);
    }
}
