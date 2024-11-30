interface RenderTask {
    id: string;
    priority: number;
    renderer: string;
    data: any;
    options: any;
    callback: (result: any) => void;
}

export class RenderQueue {
    private static instance: RenderQueue;
    private queue: RenderTask[];
    private isProcessing: boolean;
    private maxConcurrent: number;
    private activeRenderers: Set<string>;

    private constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.maxConcurrent = 3; // Configurable based on system capacity
        this.activeRenderers = new Set();
    }

    static getInstance(): RenderQueue {
        if (!RenderQueue.instance) {
            RenderQueue.instance = new RenderQueue();
        }
        return RenderQueue.instance;
    }

    enqueue(task: RenderTask): void {
        // Insert task in priority order
        const insertIndex = this.queue.findIndex(t => t.priority < task.priority);
        if (insertIndex === -1) {
            this.queue.push(task);
        } else {
            this.queue.splice(insertIndex, 0, task);
        }

        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            // Process tasks that can be rendered concurrently
            const tasks = this.getNextBatch();
            if (tasks.length === 0) {
                break;
            }

            // Render batch concurrently
            await Promise.all(tasks.map(task => this.renderTask(task)));
        }

        this.isProcessing = false;
    }

    private getNextBatch(): RenderTask[] {
        const batch: RenderTask[] = [];
        const remainingSlots = this.maxConcurrent - this.activeRenderers.size;

        if (remainingSlots <= 0) {
            return batch;
        }

        for (const task of this.queue) {
            if (batch.length >= remainingSlots) {
                break;
            }

            // Check if renderer is available
            if (!this.activeRenderers.has(task.renderer)) {
                batch.push(task);
                this.queue = this.queue.filter(t => t.id !== task.id);
                this.activeRenderers.add(task.renderer);
            }
        }

        return batch;
    }

    private async renderTask(task: RenderTask): Promise<void> {
        try {
            // Simulate async rendering
            const result = await new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        data: `Rendered ${task.renderer} with id ${task.id}`
                    });
                }, Math.random() * 1000); // Simulate varying render times
            });

            task.callback(result);
        } catch (error) {
            console.error(`Error rendering task ${task.id}:`, error);
            task.callback({ success: false, error });
        } finally {
            this.activeRenderers.delete(task.renderer);
        }
    }

    clearQueue(): void {
        this.queue = [];
        this.activeRenderers.clear();
        this.isProcessing = false;
    }

    getQueueStatus(): {
        queueLength: number;
        activeRenderers: string[];
        isProcessing: boolean;
    } {
        return {
            queueLength: this.queue.length,
            activeRenderers: Array.from(this.activeRenderers),
            isProcessing: this.isProcessing
        };
    }
}
