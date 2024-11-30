import { Metric } from '../../domain/types';

interface HeatmapCell {
    x: number;
    y: number;
    value: number;
}

interface HeatmapOptions {
    title: string;
    xAxis: string;
    yAxis: string;
    colorScale: string[];
    dimensions: string[];
}

export class HeatmapRenderer {
    private static instance: HeatmapRenderer;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private colorScales: Map<string, string[]>;

    private constructor() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;
        this.initializeColorScales();
    }

    static getInstance(): HeatmapRenderer {
        if (!HeatmapRenderer.instance) {
            HeatmapRenderer.instance = new HeatmapRenderer();
        }
        return HeatmapRenderer.instance;
    }

    renderHeatmap(data: Metric[], options: HeatmapOptions): HTMLCanvasElement {
        const cells = this.processData(data, options);
        this.drawHeatmap(cells, options);
        return this.canvas;
    }

    private initializeColorScales(): void {
        this.colorScales = new Map([
            ['temperature', [
                '#313695', '#4575b4', '#74add1', '#abd9e9',
                '#e0f3f8', '#ffffbf', '#fee090', '#fdae61',
                '#f46d43', '#d73027', '#a50026'
            ]],
            ['density', [
                '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1',
                '#6baed6', '#4292c6', '#2171b5', '#08519c',
                '#08306b'
            ]]
        ]);
    }

    private processData(metrics: Metric[], options: HeatmapOptions): HeatmapCell[] {
        const cells: HeatmapCell[] = [];
        const xValues = new Set<number>();
        const yValues = new Set<number>();

        // Extract unique x and y values
        metrics.forEach(metric => {
            if (metric.labels) {
                const x = parseFloat(metric.labels[options.xAxis]);
                const y = parseFloat(metric.labels[options.yAxis]);
                if (!isNaN(x) && !isNaN(y)) {
                    xValues.add(x);
                    yValues.add(y);
                }
            }
        });

        // Create normalized grid
        const xArray = Array.from(xValues).sort((a, b) => a - b);
        const yArray = Array.from(yValues).sort((a, b) => a - b);

        // Map metrics to grid
        metrics.forEach(metric => {
            if (metric.labels) {
                const x = parseFloat(metric.labels[options.xAxis]);
                const y = parseFloat(metric.labels[options.yAxis]);
                if (!isNaN(x) && !isNaN(y)) {
                    const xIndex = xArray.indexOf(x);
                    const yIndex = yArray.indexOf(y);
                    cells.push({
                        x: xIndex,
                        y: yIndex,
                        value: metric.value
                    });
                }
            }
        });

        return cells;
    }

    private drawHeatmap(cells: HeatmapCell[], options: HeatmapOptions): void {
        const { width, height } = this.canvas;
        const margin = 50;
        const cellWidth = (width - 2 * margin) / cells.length;
        const cellHeight = (height - 2 * margin) / cells.length;

        // Clear canvas
        this.context.clearRect(0, 0, width, height);

        // Draw title
        this.context.font = '16px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(options.title, width / 2, margin / 2);

        // Draw cells
        cells.forEach(cell => {
            const x = margin + cell.x * cellWidth;
            const y = margin + cell.y * cellHeight;
            
            // Get color based on value
            const colorScale = this.colorScales.get(options.colorScale) || this.colorScales.get('density')!;
            const colorIndex = Math.floor((cell.value / Math.max(...cells.map(c => c.value))) * (colorScale.length - 1));
            
            this.context.fillStyle = colorScale[colorIndex];
            this.context.fillRect(x, y, cellWidth, cellHeight);
        });

        // Draw axes
        this.drawAxes(options, margin, width - margin, height - margin);
    }

    private drawAxes(options: HeatmapOptions, startX: number, endX: number, endY: number): void {
        // X-axis
        this.context.beginPath();
        this.context.moveTo(startX, endY);
        this.context.lineTo(endX, endY);
        this.context.stroke();

        // Y-axis
        this.context.beginPath();
        this.context.moveTo(startX, startX);
        this.context.lineTo(startX, endY);
        this.context.stroke();

        // Labels
        this.context.font = '12px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(options.xAxis, (endX + startX) / 2, endY + 30);
        
        this.context.save();
        this.context.translate(startX - 30, (endY + startX) / 2);
        this.context.rotate(-Math.PI / 2);
        this.context.fillText(options.yAxis, 0, 0);
        this.context.restore();
    }
}
