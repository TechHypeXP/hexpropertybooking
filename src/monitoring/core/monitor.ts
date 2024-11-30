import { MonitoringProvider } from '../providers/base-provider';
import { Metric, HealthStatus } from '../domain/types';

export class Monitor {
    private static instance: Monitor;
    private providers: MonitoringProvider[] = [];
    private isEnabled: boolean = true;

    private constructor() {}

    static getInstance(): Monitor {
        if (!Monitor.instance) {
            Monitor.instance = new Monitor();
        }
        return Monitor.instance;
    }

    addProvider(provider: MonitoringProvider): void {
        this.providers.push(provider);
    }

    async recordMetric(metric: Metric): Promise<void> {
        if (!this.isEnabled) return;
        await Promise.all(this.providers.map(provider => provider.recordMetric(metric)));
    }

    async recordHealth(entityId: string, status: HealthStatus, message: string): Promise<void> {
        if (!this.isEnabled) return;
        await Promise.all(this.providers.map(provider => provider.recordHealth(entityId, status, message)));
    }

    async recordError(error: Error): Promise<void> {
        if (!this.isEnabled) return;
        await Promise.all(this.providers.map(provider => provider.recordError(error)));
    }

    enable(): void {
        this.isEnabled = true;
    }

    disable(): void {
        this.isEnabled = false;
    }
}
