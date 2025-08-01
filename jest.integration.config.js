/**
 * Jest Integration Test Configuration
 * Configuration for integration tests that require Discord API interaction
 */

export default {
  // Test environment
  testEnvironment: 'node',
  
  // Use ES modules
  preset: 'es-modules',
  extensionsToTreatAsEsm: ['.js'],
  
  // Integration test patterns
  testMatch: [
    '**/tests/integration/**/*.test.js',
    '**/tests/integration/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js'],
  
  // Test timeout (longer for integration tests)
  testTimeout: 60000,
  
  // Run tests serially to avoid Discord API rate limits
  maxWorkers: 1,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Module name mapping
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/integration/globalSetup.js',
  globalTeardown: '<rootDir>/tests/integration/globalTeardown.js'
};
