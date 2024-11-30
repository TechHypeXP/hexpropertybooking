import { ChartRenderer } from '../core/chart-renderer';
import { HeatmapRenderer } from '../advanced/heatmap-renderer';
import { FunnelRenderer } from '../advanced/funnel-renderer';

type RendererType = 'chart' | 'heatmap' | 'funnel';

export class RendererFactory {
    private static instance: RendererFactory;
    private rendererCache: Map<RendererType, any>;

    private constructor() {
        this.rendererCache = new Map();
    }

    static getInstance(): RendererFactory {
        if (!RendererFactory.instance) {
            RendererFactory.instance = new RendererFactory();
        }
        return RendererFactory.instance;
    }

    getRenderer(type: RendererType): any {
        if (!this.rendererCache.has(type)) {
            const renderer = this.createRenderer(type);
            this.rendererCache.set(type, renderer);
        }
        return this.rendererCache.get(type);
    }

    private createRenderer(type: RendererType): any {
        switch (type) {
            case 'chart':
                return ChartRenderer.getInstance();
            case 'heatmap':
                return HeatmapRenderer.getInstance();
            case 'funnel':
                return FunnelRenderer.getInstance();
            default:
                throw new Error(`Unknown renderer type: ${type}`);
        }
    }

    clearCache(): void {
        this.rendererCache.clear();
    }
}
