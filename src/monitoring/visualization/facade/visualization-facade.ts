import { Metric } from '../../domain/types';
import { RendererFactory } from '../optimization/renderer-factory';
import { RenderQueue } from '../optimization/render-queue';
import { DataFormatter } from '../core/data-formatter';

interface VisualizationOptions {
    type: 'chart' | 'heatmap' | 'funnel';
    title: string;
    priority?: number;
    dimensions?: string[];
    colorScale?: string[];
    showPercentages?: boolean;
    aggregation?: 'sum' | 'avg' | 'max';
}

export class VisualizationFacade {
    private static instance: VisualizationFacade;
    private rendererFactory: RendererFactory;
    private renderQueue: RenderQueue;
    private dataFormatter: DataFormatter;

    private constructor() {
        this.rendererFactory = RendererFactory.getInstance();
        this.renderQueue = RenderQueue.getInstance();
        this.dataFormatter = DataFormatter.getInstance();
    }

    static getInstance(): VisualizationFacade {
        if (!VisualizationFacade.instance) {
            VisualizationFacade.instance = new VisualizationFacade();
        }
        return VisualizationFacade.instance;
    }

    async visualizeMetrics(
        metrics: Metric[],
        options: VisualizationOptions
    ): Promise<HTMLCanvasElement> {
        return new Promise((resolve, reject) => {
            const taskId = this.generateTaskId();
            const renderer = this.rendererFactory.getRenderer(options.type);

            // Format data based on visualization type
            const formattedData = this.formatData(metrics, options);

            // Create render task
            this.renderQueue.enqueue({
                id: taskId,
                priority: options.priority || 1,
                renderer: options.type,
                data: formattedData,
                options,
                callback: (result: any) => {
                    if (result.success) {
                        resolve(renderer.render(formattedData, options));
                    } else {
                        reject(result.error);
                    }
                }
            });
        });
    }

    private formatData(metrics: Metric[], options: VisualizationOptions): any {
        switch (options.type) {
            case 'chart':
                return options.aggregation
                    ? this.dataFormatter.formatAggregatedData(metrics, options.aggregation)
                    : this.dataFormatter.formatTimeSeriesData(metrics);
            case 'heatmap':
            case 'funnel':
                return metrics;
            default:
                throw new Error(`Unsupported visualization type: ${options.type}`);
        }
    }

    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getQueueStatus(): {
        queueLength: number;
        activeRenderers: string[];
        isProcessing: boolean;
    } {
        return this.renderQueue.getQueueStatus();
    }

    clearCache(): void {
        this.rendererFactory.clearCache();
        this.renderQueue.clearQueue();
    }
}
