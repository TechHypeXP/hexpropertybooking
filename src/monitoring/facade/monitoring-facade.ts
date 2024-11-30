import { Monitor } from '../core/monitor';
import { PerformanceProfiler } from '../core/performance-profiler';
import { BatchProcessor } from '../core/batch-processor';
import { RetryHandler } from '../core/retry-handler';
import { AnomalyDetector } from '../advanced/anomaly-detector';
import { AlertCorrelator } from '../advanced/alert-correlator';
import { MetricBuffer } from '../optimization/metric-buffer';
import { LoadShedder } from '../optimization/load-shedder';
import { Tracer } from '../tracing/tracer';
import { MetricAggregator } from '../metrics/aggregator';
import { Metric, HealthStatus, Span } from '../domain/types';

export class MonitoringFacade {
    private static instance: MonitoringFacade;
    private monitor: Monitor;
    private profiler: PerformanceProfiler;
    private batchProcessor: BatchProcessor;
    private retryHandler: RetryHandler;
    private anomalyDetector: AnomalyDetector;
    private alertCorrelator: AlertCorrelator;
    private metricBuffer: MetricBuffer;
    private loadShedder: LoadShedder;
    private tracer: Tracer;
    private aggregator: MetricAggregator;

    private constructor() {
        this.monitor = Monitor.getInstance();
        this.profiler = PerformanceProfiler.getInstance();
        this.batchProcessor = BatchProcessor.getInstance();
        this.retryHandler = RetryHandler.getInstance();
        this.anomalyDetector = AnomalyDetector.getInstance();
        this.alertCorrelator = AlertCorrelator.getInstance();
        this.metricBuffer = MetricBuffer.getInstance();
        this.loadShedder = LoadShedder.getInstance();
        this.tracer = Tracer.getInstance();
        this.aggregator = MetricAggregator.getInstance();
    }

    static getInstance(): MonitoringFacade {
        if (!MonitoringFacade.instance) {
            MonitoringFacade.instance = new MonitoringFacade();
        }
        return MonitoringFacade.instance;
    }

    async recordMetric(metric: Metric): Promise<void> {
        if (!this.loadShedder.shouldProcessRequest()) {
            return;
        }

        await this.retryHandler.withRetry(async () => {
            await this.metricBuffer.addMetric(metric);
            await this.aggregator.processMetric(metric);
            await this.anomalyDetector.analyzeMetric(metric);
        }, 'record_metric');
    }

    startOperation(name: string): Span {
        const span = this.tracer.startSpan(name);
        const startTime = Date.now();

        // Automatically record performance metrics when span ends
        this.tracer.addAttribute(span, 'startTime', startTime.toString());
        
        return span;
    }

    async endOperation(span: Span): Promise<void> {
        await this.tracer.endSpan(span);
        const startTime = parseInt(span.attributes?.startTime as string);
        await this.profiler.recordLatency(span.name, startTime);
    }

    async recordError(error: Error, context?: Record<string, any>): Promise<void> {
        await this.retryHandler.withRetry(async () => {
            await this.monitor.recordError(error);
            await this.alertCorrelator.processError({
                name: error.name,
                message: error.message,
                stack: error.stack,
                severity: 'high',
                context
            });
        }, 'record_error');
    }

    async recordHealth(
        component: string,
        status: HealthStatus,
        message: string
    ): Promise<void> {
        await this.retryHandler.withRetry(async () => {
            await this.monitor.recordHealth(component, status, message);
        }, 'record_health');
    }

    configureAggregation(
        metricName: string,
        type: 'sum' | 'avg' | 'min' | 'max' | 'percentile',
        windowMs: number,
        options?: { percentile?: number; labels?: string[] }
    ): void {
        this.aggregator.registerAggregation(metricName, {
            type,
            window: windowMs,
            ...options
        });
    }

    setTracingSamplingRate(rate: number): void {
        this.tracer.setSamplingRate(rate);
    }

    enableLoadShedding(): void {
        this.loadShedder.enable();
    }

    disableLoadShedding(): void {
        this.loadShedder.disable();
    }

    async recordResourceUsage(usage: {
        cpu?: number;
        memory?: number;
        requestRate?: number;
    }): Promise<void> {
        this.loadShedder.updateResourceUsage(usage);
        
        if (usage.cpu) {
            await this.recordMetric({
                name: 'system_cpu_usage',
                value: usage.cpu,
                timestamp: Date.now(),
                unit: 'percent'
            });
        }

        if (usage.memory) {
            await this.recordMetric({
                name: 'system_memory_usage',
                value: usage.memory,
                timestamp: Date.now(),
                unit: 'percent'
            });
        }

        if (usage.requestRate) {
            await this.recordMetric({
                name: 'system_request_rate',
                value: usage.requestRate,
                timestamp: Date.now(),
                unit: 'requests_per_second'
            });
        }
    }
}
