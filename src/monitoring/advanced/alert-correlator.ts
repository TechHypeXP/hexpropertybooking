import { Monitor } from '../core/monitor';
import { ErrorEventSchema, HealthStatus } from '../domain/types';

interface Alert {
    id: string;
    source: string;
    type: string;
    severity: string;
    timestamp: number;
    message: string;
    context?: Record<string, any>;
}

interface CorrelationRule {
    name: string;
    timeWindow: number;
    conditions: {
        type: string;
        threshold: number;
        sources?: string[];
    }[];
}

export class AlertCorrelator {
    private static instance: AlertCorrelator;
    private monitor: Monitor;
    private alerts: Alert[] = [];
    private rules: CorrelationRule[] = [];
    private readonly maxAlertAge = 3600000; // 1 hour in milliseconds

    private constructor() {
        this.monitor = Monitor.getInstance();
        this.initializeRules();
        this.startPeriodicCleanup();
    }

    static getInstance(): AlertCorrelator {
        if (!AlertCorrelator.instance) {
            AlertCorrelator.instance = new AlertCorrelator();
        }
        return AlertCorrelator.instance;
    }

    async processAlert(alert: Alert): Promise<void> {
        this.alerts.push(alert);
        await this.correlateAlerts();
    }

    async processError(error: ErrorEventSchema): Promise<void> {
        const alert: Alert = {
            id: this.generateAlertId(),
            source: error.name,
            type: 'error',
            severity: error.severity,
            timestamp: Date.now(),
            message: error.message,
            context: error.context
        };

        await this.processAlert(alert);
    }

    private initializeRules(): void {
        this.rules = [
            {
                name: 'High Error Rate',
                timeWindow: 300000, // 5 minutes
                conditions: [{
                    type: 'error',
                    threshold: 5
                }]
            },
            {
                name: 'Service Degradation',
                timeWindow: 600000, // 10 minutes
                conditions: [
                    {
                        type: 'latency',
                        threshold: 3,
                        sources: ['api_gateway', 'database']
                    },
                    {
                        type: 'error',
                        threshold: 2
                    }
                ]
            },
            {
                name: 'System Overload',
                timeWindow: 300000, // 5 minutes
                conditions: [
                    {
                        type: 'cpu_usage',
                        threshold: 3
                    },
                    {
                        type: 'memory_usage',
                        threshold: 3
                    }
                ]
            }
        ];
    }

    private async correlateAlerts(): Promise<void> {
        const now = Date.now();
        
        for (const rule of this.rules) {
            const relevantAlerts = this.alerts.filter(alert => 
                now - alert.timestamp <= rule.timeWindow
            );

            if (this.checkRuleConditions(rule, relevantAlerts)) {
                await this.triggerCorrelatedAlert(rule, relevantAlerts);
            }
        }
    }

    private checkRuleConditions(rule: CorrelationRule, alerts: Alert[]): boolean {
        return rule.conditions.every(condition => {
            const matchingAlerts = alerts.filter(alert =>
                alert.type === condition.type &&
                (!condition.sources || condition.sources.includes(alert.source))
            );
            return matchingAlerts.length >= condition.threshold;
        });
    }

    private async triggerCorrelatedAlert(rule: CorrelationRule, alerts: Alert[]): Promise<void> {
        const correlationId = this.generateAlertId();
        const correlatedAlert = {
            id: correlationId,
            source: 'alert_correlator',
            type: 'correlation',
            severity: 'high',
            timestamp: Date.now(),
            message: `Correlation rule '${rule.name}' triggered`,
            context: {
                ruleName: rule.name,
                correlatedAlerts: alerts.map(a => a.id),
                alertCount: alerts.length
            }
        };

        await Promise.all([
            this.monitor.recordHealth(
                'alert_correlation',
                HealthStatus.DEGRADED,
                `Multiple related alerts detected: ${rule.name}`
            ),
            this.processAlert(correlatedAlert)
        ]);
    }

    private generateAlertId(): string {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private startPeriodicCleanup(): void {
        setInterval(() => {
            const now = Date.now();
            this.alerts = this.alerts.filter(alert =>
                now - alert.timestamp <= this.maxAlertAge
            );
        }, 300000); // Clean up every 5 minutes
    }
}
