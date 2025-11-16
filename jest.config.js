const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globalTeardown: '<rootDir>/jest.teardown.js',
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next-auth$': '<rootDir>/tests/__mocks__/next-auth.ts',
    '^next-auth/providers/credentials$': '<rootDir>/tests/__mocks__/next-auth-providers.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(js-cookie|next-auth|@auth|@panva)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/**',
    '!src/styles/**',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.[jt]s?(x)',
    '<rootDir>/tests/**/*.spec.[jt]s?(x)',
  ],
  roots: ['<rootDir>/tests'],
}

module.exports = createJestConfig(customJestConfig)
