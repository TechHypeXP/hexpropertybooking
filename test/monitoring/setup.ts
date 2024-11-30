import { jest } from '@jest/globals';

// Set up global test environment
beforeAll(() => {
  // Reset all mocks before each test suite
  jest.clearAllMocks();
  
  // Set environment variables
  process.env.NODE_ENV = 'test';
  process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
  process.env.PROMETHEUS_ENDPOINT = 'http://localhost:9090';
});

// Clean up after each test
afterEach(() => {
  jest.clearAllTimers();
});

// Global test timeout
jest.setTimeout(10000);
