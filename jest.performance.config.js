module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.performance.setup.js'],
  testMatch: ['**/__tests__/performance.test.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: './coverage/performance',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  verbose: true,
}; 