// Global test setup

// Mock crypto.randomUUID for consistent testing
global.crypto = {
  randomUUID: jest.fn(() => 'test-uuid-123')
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup test data cleanup
afterEach(() => {
  jest.clearAllMocks();
});
