import { Monitor } from '../core/monitor';
import { Metric } from '../domain/types';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

interface BufferConfig {
    maxSize: number;
    flushInterval: number;
    compressionThreshold: number;
    samplingRate: number;
}

export class MetricBuffer {
    private static instance: MetricBuffer;
    private monitor: Monitor;
    private buffer: Map<string, Metric[]> = new Map();
    private compressedBuffers: Map<string, Buffer> = new Map();
    private config: BufferConfig;
    private processingLock: boolean = false;

    private constructor() {
        this.monitor = Monitor.getInstance();
        this.config = this.getDefaultConfig();
        this.startPeriodicFlush();
    }

    static getInstance(): MetricBuffer {
        if (!MetricBuffer.instance) {
            MetricBuffer.instance = new MetricBuffer();
        }
        return MetricBuffer.instance;
    }

    async addMetric(metric: Metric): Promise<void> {
        // Apply sampling if needed
        if (Math.random() > this.config.samplingRate) {
            return;
        }

        const bufferKey = this.getBufferKey(metric);
        
        if (!this.buffer.has(bufferKey)) {
            this.buffer.set(bufferKey, []);
        }

        const metrics = this.buffer.get(bufferKey)!;
        metrics.push(metric);

        if (metrics.length >= this.config.maxSize) {
            await this.flushBuffer(bufferKey);
        }
    }

    private getDefaultConfig(): BufferConfig {
        return {
            maxSize: 1000,
            flushInterval: 60000, // 1 minute
            compressionThreshold: 100, // Compress if more than 100 metrics
            samplingRate: 1.0 // No sampling by default
        };
    }

    private getBufferKey(metric: Metric): string {
        return `${metric.name}_${JSON.stringify(metric.labels || {})}`;
    }

    private async flushBuffer(bufferKey: string): Promise<void> {
        if (this.processingLock) return;

        try {
            this.processingLock = true;
            const metrics = this.buffer.get(bufferKey) || [];
            
            if (metrics.length === 0) return;

            if (metrics.length > this.config.compressionThreshold) {
                await this.compressAndStore(bufferKey, metrics);
            } else {
                await this.sendMetrics(metrics);
            }

            this.buffer.set(bufferKey, []);
        } finally {
            this.processingLock = false;
        }
    }

    private async compressAndStore(bufferKey: string, metrics: Metric[]): Promise<void> {
        try {
            const data = JSON.stringify(metrics);
            const compressed = await gzip(data);
            this.compressedBuffers.set(bufferKey, compressed);

            // If compressed buffer gets too large, force a flush
            if (compressed.length > 1024 * 1024) { // 1MB
                await this.flushCompressedBuffer(bufferKey);
            }
        } catch (error) {
            console.error('Error compressing metrics:', error);
            // Fallback to sending uncompressed
            await this.sendMetrics(metrics);
        }
    }

    private async flushCompressedBuffer(bufferKey: string): Promise<void> {
        const compressed = this.compressedBuffers.get(bufferKey);
        if (!compressed) return;

        try {
            const decompressed = await gunzip(compressed);
            const metrics: Metric[] = JSON.parse(decompressed.toString());
            await this.sendMetrics(metrics);
            this.compressedBuffers.delete(bufferKey);
        } catch (error) {
            console.error('Error decompressing metrics:', error);
        }
    }

    private async sendMetrics(metrics: Metric[]): Promise<void> {
        // Batch send metrics
        const batchSize = 100;
        for (let i = 0; i < metrics.length; i += batchSize) {
            const batch = metrics.slice(i, i + batchSize);
            const promises = batch.map(metric => this.monitor.recordMetric(metric));
            await Promise.all(promises);
        }
    }

    private startPeriodicFlush(): void {
        setInterval(async () => {
            for (const bufferKey of this.buffer.keys()) {
                await this.flushBuffer(bufferKey);
            }
            
            for (const bufferKey of this.compressedBuffers.keys()) {
                await this.flushCompressedBuffer(bufferKey);
            }
        }, this.config.flushInterval);
    }

    updateConfig(config: Partial<BufferConfig>): void {
        this.config = {
            ...this.config,
            ...config
        };
    }
}
