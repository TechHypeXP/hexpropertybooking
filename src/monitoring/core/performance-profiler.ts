import { Monitor } from './monitor';
import { Metric, HealthStatus } from '../domain/types';

export class PerformanceProfiler {
    private static instance: PerformanceProfiler;
    private monitor: Monitor;
    private metricsBuffer: Map<string, number[]> = new Map();
    private bufferSize: number = 100;
    private flushInterval: number = 5000; // 5 seconds

    private constructor() {
        this.monitor = Monitor.getInstance();
        this.startPeriodicFlush();
    }

    static getInstance(): PerformanceProfiler {
        if (!PerformanceProfiler.instance) {
            PerformanceProfiler.instance = new PerformanceProfiler();
        }
        return PerformanceProfiler.instance;
    }

    async recordLatency(operation: string, startTime: number): Promise<void> {
        const latency = Date.now() - startTime;
        this.bufferMetric(`${operation}_latency`, latency);
        
        // Check for performance degradation
        const avgLatency = this.calculateAverage(`${operation}_latency`);
        if (avgLatency > this.getThreshold(operation)) {
            await this.monitor.recordHealth(
                operation,
                HealthStatus.DEGRADED,
                `High latency detected: ${avgLatency}ms`
            );
        }
    }

    async recordMemoryUsage(component: string): Promise<void> {
        const memoryUsage = process.memoryUsage();
        await this.monitor.recordMetric({
            name: `${component}_memory_heap_used`,
            value: memoryUsage.heapUsed,
            timestamp: Date.now(),
            unit: 'bytes'
        });
    }

    private bufferMetric(name: string, value: number): void {
        if (!this.metricsBuffer.has(name)) {
            this.metricsBuffer.set(name, []);
        }
        
        const buffer = this.metricsBuffer.get(name)!;
        buffer.push(value);
        
        if (buffer.length >= this.bufferSize) {
            this.flushMetric(name);
        }
    }

    private async flushMetric(name: string): Promise<void> {
        const buffer = this.metricsBuffer.get(name);
        if (!buffer || buffer.length === 0) return;

        const average = this.calculateAverage(name);
        await this.monitor.recordMetric({
            name,
            value: average,
            timestamp: Date.now(),
            labels: { type: 'average' }
        });

        this.metricsBuffer.set(name, []);
    }

    private calculateAverage(name: string): number {
        const buffer = this.metricsBuffer.get(name);
        if (!buffer || buffer.length === 0) return 0;
        
        const sum = buffer.reduce((acc, val) => acc + val, 0);
        return sum / buffer.length;
    }

    private getThreshold(operation: string): number {
        // Dynamic thresholds based on operation type
        const thresholds: Record<string, number> = {
            'database_query': 100,
            'api_request': 200,
            'ml_prediction': 500,
            'default': 300
        };
        return thresholds[operation] || thresholds.default;
    }

    private startPeriodicFlush(): void {
        setInterval(() => {
            this.metricsBuffer.forEach((_, name) => {
                this.flushMetric(name).catch(error => {
                    console.error(`Error flushing metrics for ${name}:`, error);
                });
            });
        }, this.flushInterval);
    }
}
