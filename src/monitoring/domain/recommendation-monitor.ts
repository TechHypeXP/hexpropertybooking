import { MonitoringDomain, MetricType, HealthStatus } from './types';
import { MonitoringFactory } from '../providers/monitoring-factory';

export class RecommendationMonitor {
  private static instance: RecommendationMonitor;
  private factory: MonitoringFactory;

  private constructor() {
    this.factory = MonitoringFactory.getInstance();
  }

  static getInstance(): RecommendationMonitor {
    if (!RecommendationMonitor.instance) {
      RecommendationMonitor.instance = new RecommendationMonitor();
    }
    return RecommendationMonitor.instance;
  }

  async recordAccuracy(modelId: string, accuracy: number): Promise<void> {
    await this.factory.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.RECOMMENDATION,
      name: 'model_accuracy',
      type: MetricType.GAUGE,
      value: accuracy,
      labels: { model_id: modelId },
      timestamp: new Date()
    });
  }

  async recordLearningRate(modelId: string, rate: number): Promise<void> {
    await this.factory.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.RECOMMENDATION,
      name: 'learning_rate',
      type: MetricType.GAUGE,
      value: rate,
      labels: { model_id: modelId },
      timestamp: new Date()
    });
  }

  async recordResponseTime(modelId: string, duration: number): Promise<void> {
    await this.factory.getCurrentProvider().recordHistogram(
      'recommendation_response_time',
      duration,
      { model_id: modelId }
    );
  }

  async recordPredictionCount(modelId: string, count: number): Promise<void> {
    await this.factory.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.RECOMMENDATION,
      name: 'prediction_count',
      type: MetricType.COUNTER,
      value: count,
      labels: { model_id: modelId },
      timestamp: new Date()
    });
  }

  async recordModelHealth(modelId: string, status: HealthStatus, message?: string): Promise<void> {
    await this.factory.getCurrentProvider().recordHealthCheck({
      domain: MonitoringDomain.RECOMMENDATION,
      component: `model_${modelId}`,
      status,
      message,
      timestamp: new Date()
    });
  }

  async measurePrediction<T>(modelId: string, func: () => Promise<T>): Promise<T> {
    const span = this.factory.getCurrentProvider().startSpan(
      MonitoringDomain.RECOMMENDATION,
      `model_${modelId}_predict`
    );

    try {
      const startTime = Date.now();
      const result = await func();
      const duration = Date.now() - startTime;
      
      await this.recordResponseTime(modelId, duration);
      await this.recordPredictionCount(modelId, 1);
      
      return result;
    } finally {
      await this.factory.getCurrentProvider().endSpan({
        ...span,
        endTime: new Date()
      });
    }
  }

  async recordFeatureImportance(modelId: string, features: Record<string, number>): Promise<void> {
    for (const [feature, importance] of Object.entries(features)) {
      await this.factory.getCurrentProvider().recordMetric({
        domain: MonitoringDomain.RECOMMENDATION,
        name: 'feature_importance',
        type: MetricType.GAUGE,
        value: importance,
        labels: { model_id: modelId, feature },
        timestamp: new Date()
      });
    }
  }
}
