import { Monitor } from '../core/monitor';
import { Metric, HealthStatus } from '../domain/types';

interface LoadThresholds {
    cpu: number;
    memory: number;
    requestRate: number;
}

interface ResourceUsage {
    cpu: number;
    memory: number;
    requestRate: number;
}

export class LoadShedder {
    private static instance: LoadShedder;
    private monitor: Monitor;
    private enabled: boolean = true;
    private thresholds: LoadThresholds;
    private currentUsage: ResourceUsage;
    private shedding: boolean = false;
    private checkInterval: number = 5000; // 5 seconds

    private constructor() {
        this.monitor = Monitor.getInstance();
        this.thresholds = this.getDefaultThresholds();
        this.currentUsage = this.getInitialUsage();
        this.startMonitoring();
    }

    static getInstance(): LoadShedder {
        if (!LoadShedder.instance) {
            LoadShedder.instance = new LoadShedder();
        }
        return LoadShedder.instance;
    }

    shouldProcessRequest(): boolean {
        if (!this.enabled) return true;
        
        if (this.shedding) {
            // During shedding, only accept requests based on priority and current load
            return Math.random() > this.calculateRejectProbability();
        }
        
        return true;
    }

    updateResourceUsage(usage: Partial<ResourceUsage>): void {
        this.currentUsage = {
            ...this.currentUsage,
            ...usage
        };

        this.evaluateLoadShedding();
    }

    private getDefaultThresholds(): LoadThresholds {
        return {
            cpu: 80, // 80% CPU usage
            memory: 85, // 85% memory usage
            requestRate: 1000 // requests per second
        };
    }

    private getInitialUsage(): ResourceUsage {
        return {
            cpu: 0,
            memory: 0,
            requestRate: 0
        };
    }

    private async evaluateLoadShedding(): Promise<void> {
        const shouldShed = this.shouldActivateLoadShedding();
        
        if (shouldShed !== this.shedding) {
            this.shedding = shouldShed;
            
            const status = shouldShed ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;
            const message = shouldShed
                ? 'Load shedding activated due to high resource usage'
                : 'Load shedding deactivated, normal operation resumed';

            await this.monitor.recordHealth('load_shedder', status, message);
        }
    }

    private shouldActivateLoadShedding(): boolean {
        return (
            this.currentUsage.cpu > this.thresholds.cpu ||
            this.currentUsage.memory > this.thresholds.memory ||
            this.currentUsage.requestRate > this.thresholds.requestRate
        );
    }

    private calculateRejectProbability(): number {
        // Calculate rejection probability based on how far we are over thresholds
        const cpuExcess = Math.max(0, (this.currentUsage.cpu - this.thresholds.cpu) / 100);
        const memoryExcess = Math.max(0, (this.currentUsage.memory - this.thresholds.memory) / 100);
        const requestExcess = Math.max(0, 
            (this.currentUsage.requestRate - this.thresholds.requestRate) / this.thresholds.requestRate
        );

        // Weight the factors (can be adjusted based on importance)
        const weights = {
            cpu: 0.4,
            memory: 0.3,
            requestRate: 0.3
        };

        return Math.min(
            0.9, // Never reject more than 90% of requests
            cpuExcess * weights.cpu +
            memoryExcess * weights.memory +
            requestExcess * weights.requestRate
        );
    }

    private startMonitoring(): void {
        setInterval(async () => {
            try {
                // Update CPU usage
                const cpuUsage = process.cpuUsage();
                const totalCPUUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

                // Update memory usage
                const memUsage = process.memoryUsage();
                const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

                this.updateResourceUsage({
                    cpu: totalCPUUsage,
                    memory: memoryUsagePercent
                });

                // Record metrics
                await Promise.all([
                    this.monitor.recordMetric({
                        name: 'load_shedder_cpu_usage',
                        value: totalCPUUsage,
                        timestamp: Date.now()
                    }),
                    this.monitor.recordMetric({
                        name: 'load_shedder_memory_usage',
                        value: memoryUsagePercent,
                        timestamp: Date.now()
                    }),
                    this.monitor.recordMetric({
                        name: 'load_shedder_reject_probability',
                        value: this.calculateRejectProbability(),
                        timestamp: Date.now()
                    })
                ]);
            } catch (error) {
                console.error('Error in load shedder monitoring:', error);
            }
        }, this.checkInterval);
    }

    updateThresholds(thresholds: Partial<LoadThresholds>): void {
        this.thresholds = {
            ...this.thresholds,
            ...thresholds
        };
    }

    enable(): void {
        this.enabled = true;
    }

    disable(): void {
        this.enabled = false;
        this.shedding = false;
    }
}
