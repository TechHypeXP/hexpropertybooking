import { Metric } from '../../domain/types';

interface FormattedData {
    labels: string[];
    values: number[];
    timestamps: number[];
    metadata?: Record<string, any>;
}

export class DataFormatter {
    private static instance: DataFormatter;

    private constructor() {}

    static getInstance(): DataFormatter {
        if (!DataFormatter.instance) {
            DataFormatter.instance = new DataFormatter();
        }
        return DataFormatter.instance;
    }

    formatTimeSeriesData(metrics: Metric[]): FormattedData {
        const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);

        return {
            labels: sortedMetrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
            values: sortedMetrics.map(m => m.value),
            timestamps: sortedMetrics.map(m => m.timestamp)
        };
    }

    formatAggregatedData(metrics: Metric[], aggregation: 'sum' | 'avg' | 'max'): FormattedData {
        const groupedData = this.groupMetricsByLabel(metrics);
        
        return {
            labels: Object.keys(groupedData),
            values: Object.values(groupedData).map(group => this.aggregate(group, aggregation)),
            timestamps: [Date.now()]
        };
    }

    private groupMetricsByLabel(metrics: Metric[]): Record<string, Metric[]> {
        return metrics.reduce((groups, metric) => {
            const label = this.getGroupLabel(metric);
            if (!groups[label]) {
                groups[label] = [];
            }
            groups[label].push(metric);
            return groups;
        }, {} as Record<string, Metric[]>);
    }

    private getGroupLabel(metric: Metric): string {
        if (!metric.labels) return 'default';
        
        return Object.entries(metric.labels)
            .map(([key, value]) => `${key}:${value}`)
            .join(',');
    }

    private aggregate(metrics: Metric[], type: 'sum' | 'avg' | 'max'): number {
        switch (type) {
            case 'sum':
                return metrics.reduce((sum, m) => sum + m.value, 0);
            case 'avg':
                return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
            case 'max':
                return Math.max(...metrics.map(m => m.value));
            default:
                throw new Error(`Unknown aggregation type: ${type}`);
        }
    }
}
