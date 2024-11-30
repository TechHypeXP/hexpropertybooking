import { env } from '@/env.mjs';

interface LegacySystemConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

class LegacySystemClient {
  private config: LegacySystemConfig;

  constructor(config: LegacySystemConfig) {
    this.config = config;
  }

  async request<T>(endpoint: string, method: string, data?: unknown): Promise<T> {
    let attempts = 0;
    
    while (attempts < this.config.retries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Integration-Source': 'HexPropertyTab',
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        attempts++;
        if (attempts === this.config.retries) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
      }
    }

    throw new Error('Request failed after all retries');
  }
}

export const legacySystemFactory = {
  createReserveClient: () => new LegacySystemClient({
    baseUrl: env.LEGACY_RESERVE_API,
    timeout: 5000,
    retries: 3,
  }),

  createCalClient: () => new LegacySystemClient({
    baseUrl: env.LEGACY_CAL_API,
    timeout: 5000,
    retries: 3,
  }),

  createRentalClient: () => new LegacySystemClient({
    baseUrl: env.LEGACY_RENTAL_API,
    timeout: 5000,
    retries: 3,
  }),
};
