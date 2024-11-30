export class RetryHandler {
    private static instance: RetryHandler;
    private maxRetries: number = 3;
    private baseDelay: number = 1000; // 1 second
    private maxDelay: number = 10000; // 10 seconds

    private constructor() {}

    static getInstance(): RetryHandler {
        if (!RetryHandler.instance) {
            RetryHandler.instance = new RetryHandler();
        }
        return RetryHandler.instance;
    }

    async withRetry<T>(
        operation: () => Promise<T>,
        context: string,
        customConfig?: {
            maxRetries?: number;
            baseDelay?: number;
            maxDelay?: number;
        }
    ): Promise<T> {
        const config = {
            maxRetries: customConfig?.maxRetries ?? this.maxRetries,
            baseDelay: customConfig?.baseDelay ?? this.baseDelay,
            maxDelay: customConfig?.maxDelay ?? this.maxDelay
        };

        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                
                if (attempt === config.maxRetries) {
                    break;
                }

                const delay = this.calculateDelay(attempt, config);
                await this.sleep(delay);
                
                console.warn(
                    `Retry attempt ${attempt}/${config.maxRetries} for ${context}. ` +
                    `Error: ${lastError.message}. Retrying in ${delay}ms...`
                );
            }
        }

        throw new Error(
            `Operation '${context}' failed after ${config.maxRetries} attempts. ` +
            `Last error: ${lastError?.message}`
        );
    }

    private calculateDelay(attempt: number, config: { baseDelay: number; maxDelay: number }): number {
        // Exponential backoff with jitter
        const exponentialDelay = config.baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
        return Math.min(exponentialDelay + jitter, config.maxDelay);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
