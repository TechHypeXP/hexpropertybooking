import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { AlertManager } from '../../../src/monitoring/advanced/alert-manager';
import { MonitoringService } from '../../../src/monitoring/monitoring-service';
import { MonitoringDomain, HealthStatus } from '../../../src/monitoring/domain/types';

jest.mock('../../../src/monitoring/monitoring-service');

describe('AlertManager', () => {
  let alertManager: AlertManager;
  let mockMonitoringService: jest.Mocked<MonitoringService>;

  beforeEach(() => {
    mockMonitoringService = {
      recordHealth: jest.fn().mockResolvedValue(undefined),
      getCurrentProvider: jest.fn().mockReturnValue({
        recordMetric: jest.fn().mockResolvedValue(undefined)
      })
    } as any;

    (MonitoringService.getInstance as jest.Mock).mockReturnValue(mockMonitoringService);
    alertManager = AlertManager.getInstance();
  });

  describe('evaluateMetric', () => {
    it('should trigger alert when threshold exceeded', async () => {
      await alertManager.evaluateMetric(
        MonitoringDomain.RECOMMENDATION,
        'model_accuracy',
        0.65 // Below warning threshold of 0.7
      );

      expect(mockMonitoringService.recordHealth).toHaveBeenCalledWith(
        MonitoringDomain.RECOMMENDATION,
        'alert_model_accuracy',
        HealthStatus.DEGRADED,
        expect.any(String)
      );
    });

    it('should resolve alert when metric returns to normal', async () => {
      // First trigger alert
      await alertManager.evaluateMetric(
        MonitoringDomain.RECOMMENDATION,
        'model_accuracy',
        0.65
      );

      // Then resolve it
      await alertManager.evaluateMetric(
        MonitoringDomain.RECOMMENDATION,
        'model_accuracy',
        0.75
      );

      expect(mockMonitoringService.recordHealth).toHaveBeenLastCalledWith(
        MonitoringDomain.RECOMMENDATION,
        'alert_model_accuracy',
        HealthStatus.HEALTHY,
        'Alert resolved'
      );
    });
  });

  describe('addRule', () => {
    it('should allow adding custom alert rules', async () => {
      alertManager.addRule({
        domain: MonitoringDomain.BOOKING,
        metricName: 'custom_metric',
        threshold: 100,
        operator: 'gt',
        severity: 'CRITICAL'
      });

      await alertManager.evaluateMetric(
        MonitoringDomain.BOOKING,
        'custom_metric',
        150
      );

      expect(mockMonitoringService.recordHealth).toHaveBeenCalledWith(
        MonitoringDomain.BOOKING,
        'alert_custom_metric',
        HealthStatus.UNHEALTHY,
        expect.any(String)
      );
    });
  });

  describe('getActiveAlerts', () => {
    it('should return current active alerts', async () => {
      await alertManager.evaluateMetric(
        MonitoringDomain.RECOMMENDATION,
        'model_accuracy',
        0.65
      );

      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0]).toMatchObject({
        rule: {
          domain: MonitoringDomain.RECOMMENDATION,
          metricName: 'model_accuracy'
        },
        value: 0.65
      });
    });
  });
});
