import { Monitor } from '../core/monitor';
import { Metric } from '../domain/types';

type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'percentile';

interface AggregationConfig {
    type: AggregationType;
    window: number;
    percentile?: number;
    labels?: string[];
}

interface AggregationWindow {
    values: number[];
    startTime: number;
    endTime: number;
}

export class MetricAggregator {
    private static instance: MetricAggregator;
    private monitor: Monitor;
    private aggregations: Map<string, AggregationConfig> = new Map();
    private windows: Map<string, AggregationWindow> = new Map();
    private readonly cleanupInterval: number = 300000; // 5 minutes

    private constructor() {
        this.monitor = Monitor.getInstance();
        this.startPeriodicCleanup();
    }

    static getInstance(): MetricAggregator {
        if (!MetricAggregator.instance) {
            MetricAggregator.instance = new MetricAggregator();
        }
        return MetricAggregator.instance;
    }

    registerAggregation(
        metricName: string,
        config: AggregationConfig
    ): void {
        this.aggregations.set(metricName, {
            ...config,
            window: config.window || 60000 // Default 1 minute
        });
    }

    async processMetric(metric: Metric): Promise<void> {
        const config = this.aggregations.get(metric.name);
        if (!config) return;

        const windowKey = this.getWindowKey(metric, config);
        const window = this.getOrCreateWindow(windowKey, config.window);
        
        window.values.push(metric.value);
        
        if (Date.now() >= window.endTime) {
            await this.aggregateAndFlush(metric, windowKey, config);
        }
    }

    private getWindowKey(metric: Metric, config: AggregationConfig): string {
        const labelValues = config.labels
            ?.map(label => metric.labels?.[label] || '')
            .join(':') || '';
            
        return `${metric.name}:${labelValues}`;
    }

    private getOrCreateWindow(
        windowKey: string,
        windowSize: number
    ): AggregationWindow {
        if (!this.windows.has(windowKey)) {
            const now = Date.now();
            this.windows.set(windowKey, {
                values: [],
                startTime: now,
                endTime: now + windowSize
            });
        }
        return this.windows.get(windowKey)!;
    }

    private async aggregateAndFlush(
        metric: Metric,
        windowKey: string,
        config: AggregationConfig
    ): Promise<void> {
        const window = this.windows.get(windowKey)!;
        if (window.values.length === 0) return;

        const aggregatedValue = this.calculateAggregation(window.values, config);
        
        const aggregatedMetric: Metric = {
            name: `${metric.name}_${config.type}`,
            value: aggregatedValue,
            timestamp: Date.now(),
            labels: {
                ...metric.labels,
                aggregation: config.type,
                window: `${config.window}ms`
            }
        };

        await this.monitor.recordMetric(aggregatedMetric);
        
        // Start new window
        const now = Date.now();
        this.windows.set(windowKey, {
            values: [],
            startTime: now,
            endTime: now + config.window
        });
    }

    private calculateAggregation(
        values: number[],
        config: AggregationConfig
    ): number {
        switch (config.type) {
            case 'sum':
                return values.reduce((a, b) => a + b, 0);
            
            case 'avg':
                return values.reduce((a, b) => a + b, 0) / values.length;
            
            case 'min':
                return Math.min(...values);
            
            case 'max':
                return Math.max(...values);
            
            case 'percentile':
                if (!config.percentile) return 0;
                const sorted = [...values].sort((a, b) => a - b);
                const index = Math.ceil((config.percentile / 100) * sorted.length) - 1;
                return sorted[index];
            
            default:
                throw new Error(`Unknown aggregation type: ${config.type}`);
        }
    }

    private startPeriodicCleanup(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [windowKey, window] of this.windows.entries()) {
                if (now > window.endTime + this.cleanupInterval) {
                    this.windows.delete(windowKey);
                }
            }
        }, this.cleanupInterval);
    }
}
