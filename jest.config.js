// jest.config.js
export default {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest'
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/*.spec.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!@org\\/pkg1|@org\\/pkg2).+\\.js$',
    '/node_modules/(?!lodash-es).+\\.mjs$'
  ],
  moduleNameMapper: {
    // Add any module mappings here if needed
  }
};
