import { MonitoringService } from '../monitoring-service';
import { MonitoringDomain, HealthStatus } from '../domain/types';

interface AlertRule {
  domain: MonitoringDomain;
  metricName: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

interface Alert {
  rule: AlertRule;
  value: number;
  timestamp: Date;
  message: string;
}

export class AlertManager {
  private static instance: AlertManager;
  private monitoringService: MonitoringService;
  private rules: AlertRule[] = [];
  private activeAlerts: Map<string, Alert> = new Map();

  private constructor() {
    this.monitoringService = MonitoringService.getInstance();
    this.initializeDefaultRules();
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  private initializeDefaultRules(): void {
    this.addRule({
      domain: MonitoringDomain.RECOMMENDATION,
      metricName: 'model_accuracy',
      threshold: 0.7,
      operator: 'lt',
      severity: 'WARNING'
    });

    this.addRule({
      domain: MonitoringDomain.BOOKING,
      metricName: 'booking_success',
      threshold: 0.95,
      operator: 'lt',
      severity: 'ERROR'
    });

    this.addRule({
      domain: MonitoringDomain.PROPERTY,
      metricName: 'view_rate',
      threshold: 100,
      operator: 'lt',
      severity: 'INFO'
    });
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  async evaluateMetric(domain: MonitoringDomain, metricName: string, value: number): Promise<void> {
    const applicableRules = this.rules.filter(rule => 
      rule.domain === domain && rule.metricName === metricName
    );

    for (const rule of applicableRules) {
      const isTriggered = this.evaluateRule(rule, value);
      const alertKey = `${rule.domain}_${rule.metricName}`;

      if (isTriggered && !this.activeAlerts.has(alertKey)) {
        const alert: Alert = {
          rule,
          value,
          timestamp: new Date(),
          message: `${rule.metricName} value ${value} ${rule.operator} ${rule.threshold}`
        };

        this.activeAlerts.set(alertKey, alert);
        await this.notifyAlert(alert);
      } else if (!isTriggered && this.activeAlerts.has(alertKey)) {
        this.activeAlerts.delete(alertKey);
        await this.notifyResolved(alertKey);
      }
    }
  }

  private evaluateRule(rule: AlertRule, value: number): boolean {
    switch (rule.operator) {
      case 'gt':
        return value > rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'eq':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  private async notifyAlert(alert: Alert): Promise<void> {
    const healthStatus = this.severityToHealth(alert.rule.severity);
    
    await this.monitoringService.recordHealth(
      alert.rule.domain,
      `alert_${alert.rule.metricName}`,
      healthStatus,
      alert.message
    );
  }

  private async notifyResolved(alertKey: string): Promise<void> {
    const [domain, metricName] = alertKey.split('_');
    
    await this.monitoringService.recordHealth(
      domain as MonitoringDomain,
      `alert_${metricName}`,
      HealthStatus.HEALTHY,
      'Alert resolved'
    );
  }

  private severityToHealth(severity: string): HealthStatus {
    switch (severity) {
      case 'CRITICAL':
      case 'ERROR':
        return HealthStatus.UNHEALTHY;
      case 'WARNING':
        return HealthStatus.DEGRADED;
      default:
        return HealthStatus.HEALTHY;
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
}
