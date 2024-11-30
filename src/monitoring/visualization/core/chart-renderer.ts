import { Metric } from '../../domain/types';

interface ChartOptions {
    type: 'line' | 'bar' | 'gauge' | 'table';
    title: string;
    dimensions?: string[];
    thresholds?: number[];
}

export class ChartRenderer {
    private static instance: ChartRenderer;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private constructor() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;
    }

    static getInstance(): ChartRenderer {
        if (!ChartRenderer.instance) {
            ChartRenderer.instance = new ChartRenderer();
        }
        return ChartRenderer.instance;
    }

    renderLineChart(metrics: Metric[], options: ChartOptions): HTMLCanvasElement {
        const { width, height } = this.canvas;
        this.context.clearRect(0, 0, width, height);

        // Draw axes
        this.drawAxes();

        // Plot metrics
        this.plotMetrics(metrics);

        // Add title and legends
        this.addChartDecorations(options);

        return this.canvas;
    }

    renderGaugeChart(value: number, options: ChartOptions): HTMLCanvasElement {
        const { width, height } = this.canvas;
        this.context.clearRect(0, 0, width, height);

        // Draw gauge background
        this.drawGaugeBackground();

        // Draw gauge value
        this.drawGaugeValue(value, options.thresholds || []);

        return this.canvas;
    }

    private drawAxes(): void {
        const { width, height } = this.canvas;
        
        // X-axis
        this.context.beginPath();
        this.context.moveTo(50, height - 50);
        this.context.lineTo(width - 50, height - 50);
        this.context.stroke();

        // Y-axis
        this.context.beginPath();
        this.context.moveTo(50, 50);
        this.context.lineTo(50, height - 50);
        this.context.stroke();
    }

    private plotMetrics(metrics: Metric[]): void {
        if (metrics.length === 0) return;

        const { width, height } = this.canvas;
        const plotWidth = width - 100;
        const plotHeight = height - 100;

        // Calculate scales
        const timeRange = Math.max(...metrics.map(m => m.timestamp)) - 
                         Math.min(...metrics.map(m => m.timestamp));
        const valueRange = Math.max(...metrics.map(m => m.value)) -
                          Math.min(...metrics.map(m => m.value));

        // Plot points
        this.context.beginPath();
        metrics.forEach((metric, index) => {
            const x = 50 + (metric.timestamp * plotWidth / timeRange);
            const y = height - 50 - (metric.value * plotHeight / valueRange);

            if (index === 0) {
                this.context.moveTo(x, y);
            } else {
                this.context.lineTo(x, y);
            }
        });
        this.context.stroke();
    }

    private drawGaugeBackground(): void {
        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        this.context.beginPath();
        this.context.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        this.context.stroke();
    }

    private drawGaugeValue(value: number, thresholds: number[]): void {
        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        // Calculate angle based on value (0-1)
        const angle = Math.PI + (value * Math.PI);

        // Draw gauge needle
        this.context.beginPath();
        this.context.moveTo(centerX, centerY);
        this.context.lineTo(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
        );
        this.context.stroke();

        // Draw thresholds
        thresholds.forEach(threshold => {
            const thresholdAngle = Math.PI + (threshold * Math.PI);
            this.context.beginPath();
            this.context.arc(centerX, centerY, radius + 5, thresholdAngle - 0.1, thresholdAngle + 0.1);
            this.context.stroke();
        });
    }

    private addChartDecorations(options: ChartOptions): void {
        const { width } = this.canvas;

        // Add title
        this.context.font = '16px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(options.title, width / 2, 30);

        // Add legends if dimensions exist
        if (options.dimensions) {
            options.dimensions.forEach((dim, index) => {
                this.context.fillText(dim, width - 100, 50 + index * 20);
            });
        }
    }
}
