export { MetricBatchProcessor } from './batch-processor';
export { PerformanceAnalyzer } from './performance-analyzer';
export { AlertManager } from './alert-manager';
export { MonitoringOptimizer } from './monitoring-optimizer';

// Initialize advanced monitoring features
import { MetricBatchProcessor } from './batch-processor';
import { PerformanceAnalyzer } from './performance-analyzer';
import { AlertManager } from './alert-manager';
import { MonitoringOptimizer } from './monitoring-optimizer';

export async function initializeAdvancedMonitoring(): Promise<void> {
  // Initialize components in order
  MetricBatchProcessor.getInstance();
  PerformanceAnalyzer.getInstance();
  AlertManager.getInstance();
  MonitoringOptimizer.getInstance();

  console.log('[Advanced Monitoring] Initialized successfully');
}

export async function shutdownAdvancedMonitoring(): Promise<void> {
  try {
    // Shutdown in reverse order
    await MetricBatchProcessor.getInstance().shutdown();
    
    console.log('[Advanced Monitoring] Shut down successfully');
  } catch (error) {
    console.error('[Advanced Monitoring] Shutdown failed:', error);
    throw error;
  }
}
