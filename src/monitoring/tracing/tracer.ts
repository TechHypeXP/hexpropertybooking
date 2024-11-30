import { Monitor } from '../core/monitor';
import { Span, HealthStatus } from '../domain/types';

interface TraceContext {
    traceId: string;
    spanId: string;
    parentId?: string;
    sampled: boolean;
    baggage: Record<string, string>;
}

export class Tracer {
    private static instance: Tracer;
    private monitor: Monitor;
    private activeSpans: Map<string, Span> = new Map();
    private samplingRate: number = 0.1; // 10% sampling
    private readonly maxSpans: number = 1000;

    private constructor() {
        this.monitor = Monitor.getInstance();
    }

    static getInstance(): Tracer {
        if (!Tracer.instance) {
            Tracer.instance = new Tracer();
        }
        return Tracer.instance;
    }

    startSpan(name: string, context?: Partial<TraceContext>): Span {
        const shouldSample = context?.sampled ?? (Math.random() < this.samplingRate);
        
        if (!shouldSample) {
            return this.createNoopSpan(name);
        }

        const span: Span = {
            id: this.generateId(),
            name,
            startTime: Date.now(),
            parentId: context?.parentId,
            attributes: {
                traceId: context?.traceId ?? this.generateId(),
                sampled: 'true',
                ...context?.baggage
            }
        };

        this.activeSpans.set(span.id, span);
        this.cleanupOldSpans();

        return span;
    }

    async endSpan(span: Span): Promise<void> {
        if (!span.attributes?.sampled) return;

        span.endTime = Date.now();
        const duration = span.endTime - span.startTime;

        await Promise.all([
            this.monitor.recordLatency(span.name, duration),
            this.monitor.recordActivity(span.id, `Completed span: ${span.name}`)
        ]);

        this.activeSpans.delete(span.id);
    }

    addAttribute(span: Span, key: string, value: string | number | boolean): void {
        if (!span.attributes?.sampled) return;
        
        span.attributes = {
            ...span.attributes,
            [key]: value
        };
    }

    async recordError(span: Span, error: Error): Promise<void> {
        if (!span.attributes?.sampled) return;

        this.addAttribute(span, 'error', 'true');
        this.addAttribute(span, 'error.message', error.message);

        await Promise.all([
            this.monitor.recordError(error),
            this.monitor.recordHealth(
                span.name,
                HealthStatus.DEGRADED,
                `Error in span: ${error.message}`
            )
        ]);
    }

    getActiveSpans(): Span[] {
        return Array.from(this.activeSpans.values());
    }

    setGlobalAttribute(key: string, value: string): void {
        this.activeSpans.forEach(span => {
            this.addAttribute(span, key, value);
        });
    }

    setSamplingRate(rate: number): void {
        this.samplingRate = Math.max(0, Math.min(1, rate));
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private createNoopSpan(name: string): Span {
        return {
            id: this.generateId(),
            name,
            startTime: Date.now(),
            attributes: { sampled: 'false' }
        };
    }

    private cleanupOldSpans(): void {
        if (this.activeSpans.size > this.maxSpans) {
            const spans = Array.from(this.activeSpans.entries());
            spans.sort(([, a], [, b]) => a.startTime - b.startTime);
            
            const toDelete = spans.slice(0, spans.length - this.maxSpans);
            toDelete.forEach(([id]) => this.activeSpans.delete(id));
        }
    }
}
