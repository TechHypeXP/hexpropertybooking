import { MonitoringService } from '../monitoring-service';
import { Span, MonitoringDomain } from '../domain/types';

interface PerformanceMetrics {
  p50: number;
  p90: number;
  p99: number;
  mean: number;
  count: number;
}

export class PerformanceAnalyzer {
  private static instance: PerformanceAnalyzer;
  private monitoringService: MonitoringService;
  private spanHistory: Map<string, number[]> = new Map();
  private readonly historySize = 1000;

  private constructor() {
    this.monitoringService = MonitoringService.getInstance();
  }

  static getInstance(): PerformanceAnalyzer {
    if (!PerformanceAnalyzer.instance) {
      PerformanceAnalyzer.instance = new PerformanceAnalyzer();
    }
    return PerformanceAnalyzer.instance;
  }

  async recordSpan(domain: MonitoringDomain, operation: string, duration: number): Promise<void> {
    const key = `${domain}_${operation}`;
    let history = this.spanHistory.get(key) || [];
    
    history.push(duration);
    if (history.length > this.historySize) {
      history = history.slice(-this.historySize);
    }
    
    this.spanHistory.set(key, history);
    await this.analyzePerformance(domain, operation, history);
  }

  private async analyzePerformance(domain: MonitoringDomain, operation: string, durations: number[]): Promise<void> {
    const metrics = this.calculateMetrics(durations);
    
    await this.monitoringService.getCurrentProvider().recordMetric({
      domain,
      name: `${operation}_p50`,
      type: 'GAUGE',
      value: metrics.p50,
      timestamp: new Date()
    });

    await this.monitoringService.getCurrentProvider().recordMetric({
      domain,
      name: `${operation}_p90`,
      type: 'GAUGE',
      value: metrics.p90,
      timestamp: new Date()
    });

    await this.monitoringService.getCurrentProvider().recordMetric({
      domain,
      name: `${operation}_p99`,
      type: 'GAUGE',
      value: metrics.p99,
      timestamp: new Date()
    });
  }

  private calculateMetrics(durations: number[]): PerformanceMetrics {
    const sorted = [...durations].sort((a, b) => a - b);
    const count = sorted.length;
    
    return {
      p50: this.percentile(sorted, 50),
      p90: this.percentile(sorted, 90),
      p99: this.percentile(sorted, 99),
      mean: durations.reduce((a, b) => a + b, 0) / count,
      count
    };
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  getMetrics(domain: MonitoringDomain, operation: string): PerformanceMetrics | undefined {
    const key = `${domain}_${operation}`;
    const history = this.spanHistory.get(key);
    
    if (!history) return undefined;
    
    return this.calculateMetrics(history);
  }
}
