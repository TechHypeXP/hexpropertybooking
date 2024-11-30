import { beforeAll, afterAll } from 'vitest';

// Global test setup for mocking, logging, and environment configuration
beforeAll(() => {
  // Set up global test environment
  process.env.NODE_ENV = 'test';
  
  // Configure global mocks
  global.console.log = vi.fn();
  global.console.error = vi.fn();
});

afterAll(() => {
  // Clean up after all tests
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

// Utility function for creating predictable test data
export function createTestData<T>(overrides: Partial<T> = {}): T {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as T;
}

// Error handling utility for consistent error testing
export function expectErrorWithCode(fn: () => void, errorCode: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeDefined();
    expect((error as Error).message).toContain(errorCode);
  }
}

// Performance measurement utility
export function measureTestPerformance(testFn: () => void, maxDuration: number = 100) {
  const start = performance.now();
  testFn();
  const end = performance.now();
  const duration = end - start;
  
  expect(duration).toBeLessThan(maxDuration);
}
