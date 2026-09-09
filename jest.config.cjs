module.exports = {
  testEnvironment: 'node', // môi trường chạy test
  // Gộp cả thư mục tests cũ (config, utils, ...) và thư mục unit/integration mới
  roots: ['<rootDir>/src/tests'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1' // Ánh xạ alias khi import module
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/index.js',
    '!src/tests/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  setupFiles: ['<rootDir>/src/tests/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.js']
}