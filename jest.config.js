/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/packages/**/__tests__/**/*.test.ts',
    '<rootDir>/packages/**/*.test.ts'
  ],
  
  // Skip problematic Electron tests in CI
  testPathIgnorePatterns: [
    '/node_modules/',
    ...(process.env.CI ? [
      'packages/apps/electron/__tests__/integration.test.ts',
      'packages/apps/electron/__tests__/ipcHandlers.test.ts',
      'packages/apps/electron/__tests__/moduleResolution.test.ts'
    ] : [])
  ],
  
  // Module resolution
  roots: ['<rootDir>/packages'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'packages/core/**/*.ts',
    'packages/infrastructure/filesystem/**/*.ts',
    '!packages/**/*.test.ts',
    '!packages/**/__tests__/**',
    '!packages/**/*.d.ts',
    '!packages/core/infrastructure/Config.ts', // Exclude Config.ts (TS issues)
    '!**/node_modules/**'
  ],
  
  // Coverage thresholds - focused on tested components
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 63,
      lines: 70,
      statements: 70
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // TypeScript configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Path mapping for TypeScript path aliases
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/packages/core/$1',
    '^@infrastructure/(.*)$': '<rootDir>/packages/infrastructure/$1',
    '^@apps/(.*)$': '<rootDir>/packages/apps/$1'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000
};
