module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/performance/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage/performance',
  coverageReporters: ['text', 'lcov'],
  setupFiles: ['<rootDir>/jest.performance.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
}; 