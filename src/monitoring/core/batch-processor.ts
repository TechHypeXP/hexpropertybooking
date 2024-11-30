import { Monitor } from './monitor';
import { Metric } from '../domain/types';

interface BatchItem {
    metric: Metric;
    retryCount: number;
    timestamp: number;
}

export class BatchProcessor {
    private static instance: BatchProcessor;
    private monitor: Monitor;
    private batchQueue: BatchItem[] = [];
    private maxBatchSize: number = 50;
    private maxRetries: number = 3;
    private batchInterval: number = 1000; // 1 second
    private processingLock: boolean = false;

    private constructor() {
        this.monitor = Monitor.getInstance();
        this.startBatchProcessing();
    }

    static getInstance(): BatchProcessor {
        if (!BatchProcessor.instance) {
            BatchProcessor.instance = new BatchProcessor();
        }
        return BatchProcessor.instance;
    }

    async queueMetric(metric: Metric): Promise<void> {
        this.batchQueue.push({
            metric,
            retryCount: 0,
            timestamp: Date.now()
        });

        if (this.batchQueue.length >= this.maxBatchSize) {
            await this.processBatch();
        }
    }

    private async processBatch(): Promise<void> {
        if (this.processingLock || this.batchQueue.length === 0) return;

        try {
            this.processingLock = true;
            const batch = this.batchQueue.splice(0, this.maxBatchSize);
            
            // Group metrics by type for efficient processing
            const groupedMetrics = this.groupMetrics(batch);
            
            // Process each group
            for (const [type, metrics] of Object.entries(groupedMetrics)) {
                try {
                    await this.processMetricGroup(type, metrics);
                } catch (error) {
                    await this.handleFailedMetrics(metrics);
                }
            }
        } finally {
            this.processingLock = false;
        }
    }

    private groupMetrics(batch: BatchItem[]): Record<string, BatchItem[]> {
        return batch.reduce((groups, item) => {
            const type = item.metric.name.split('_')[0];
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(item);
            return groups;
        }, {} as Record<string, BatchItem[]>);
    }

    private async processMetricGroup(type: string, metrics: BatchItem[]): Promise<void> {
        // Process metrics in parallel with rate limiting
        const promises = metrics.map(async (item) => {
            try {
                await this.monitor.recordMetric(item.metric);
            } catch (error) {
                if (item.retryCount < this.maxRetries) {
                    item.retryCount++;
                    this.batchQueue.push(item);
                } else {
                    console.error(`Failed to process metric after ${this.maxRetries} retries:`, item.metric);
                }
            }
        });

        await Promise.all(promises);
    }

    private async handleFailedMetrics(metrics: BatchItem[]): Promise<void> {
        const retriableMetrics = metrics.filter(item => item.retryCount < this.maxRetries);
        if (retriableMetrics.length > 0) {
            retriableMetrics.forEach(item => {
                item.retryCount++;
                this.batchQueue.push(item);
            });
        }
    }

    private startBatchProcessing(): void {
        setInterval(async () => {
            await this.processBatch();
        }, this.batchInterval);
    }
}
