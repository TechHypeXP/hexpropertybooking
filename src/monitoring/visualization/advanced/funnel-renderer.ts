import { Metric } from '../../domain/types';

interface FunnelStep {
    label: string;
    value: number;
    percentage: number;
}

interface FunnelOptions {
    title: string;
    colors: string[];
    showPercentages: boolean;
    minWidth: number;
}

export class FunnelRenderer {
    private static instance: FunnelRenderer;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private constructor() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;
    }

    static getInstance(): FunnelRenderer {
        if (!FunnelRenderer.instance) {
            FunnelRenderer.instance = new FunnelRenderer();
        }
        return FunnelRenderer.instance;
    }

    renderFunnel(metrics: Metric[], options: FunnelOptions): HTMLCanvasElement {
        const steps = this.processFunnelData(metrics);
        this.drawFunnel(steps, options);
        return this.canvas;
    }

    private processFunnelData(metrics: Metric[]): FunnelStep[] {
        // Sort metrics by step order
        const sortedMetrics = [...metrics].sort((a, b) => {
            const stepA = a.labels?.['step'] ? parseInt(a.labels['step']) : 0;
            const stepB = b.labels?.['step'] ? parseInt(b.labels['step']) : 0;
            return stepA - stepB;
        });

        // Calculate percentages
        const maxValue = sortedMetrics[0]?.value || 1;
        return sortedMetrics.map((metric, index) => ({
            label: metric.labels?.['name'] || `Step ${index + 1}`,
            value: metric.value,
            percentage: (metric.value / maxValue) * 100
        }));
    }

    private drawFunnel(steps: FunnelStep[], options: FunnelOptions): void {
        const { width, height } = this.canvas;
        const margin = 50;
        const funnelHeight = height - 2 * margin;
        const stepHeight = funnelHeight / steps.length;

        // Clear canvas
        this.context.clearRect(0, 0, width, height);

        // Draw title
        this.context.font = '16px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(options.title, width / 2, margin / 2);

        // Draw funnel steps
        steps.forEach((step, index) => {
            const topWidth = this.calculateStepWidth(step.percentage, width - 2 * margin, options.minWidth);
            const nextStep = steps[index + 1];
            const bottomWidth = nextStep 
                ? this.calculateStepWidth(nextStep.percentage, width - 2 * margin, options.minWidth)
                : options.minWidth;

            const x = (width - topWidth) / 2;
            const y = margin + index * stepHeight;

            // Draw step
            this.drawFunnelStep(
                x, y,
                topWidth, bottomWidth,
                stepHeight,
                options.colors[index % options.colors.length]
            );

            // Draw labels
            this.drawStepLabels(
                step,
                x - 10,
                y + stepHeight / 2,
                options.showPercentages
            );
        });
    }

    private calculateStepWidth(percentage: number, maxWidth: number, minWidth: number): number {
        return Math.max(minWidth, (percentage / 100) * maxWidth);
    }

    private drawFunnelStep(
        x: number,
        y: number,
        topWidth: number,
        bottomWidth: number,
        height: number,
        color: string
    ): void {
        const context = this.context;

        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + topWidth, y);
        context.lineTo(x + (topWidth + bottomWidth) / 2, y + height);
        context.lineTo(x + (topWidth - bottomWidth) / 2, y + height);
        context.closePath();

        context.fillStyle = color;
        context.fill();
        context.strokeStyle = '#ffffff';
        context.stroke();
    }

    private drawStepLabels(
        step: FunnelStep,
        x: number,
        y: number,
        showPercentages: boolean
    ): void {
        const context = this.context;
        context.font = '12px Arial';
        context.textAlign = 'right';
        context.fillStyle = '#000000';

        const label = showPercentages
            ? `${step.label} (${step.percentage.toFixed(1)}%)`
            : step.label;

        context.fillText(label, x, y);
        context.fillText(step.value.toString(), x, y + 15);
    }
}
