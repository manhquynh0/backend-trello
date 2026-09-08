module.exports = {
  testEnvironment: 'node', // môi trường chạy test
  roots: ['<rootDir>/src/tests'], // thư mục chứa các file test
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1' // Ánh xạ alias khi import module, $1 là phần chạy sau './src'
  },
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/**/index.js'], // thu thập coverage

  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.js'] // file được chạy sau khi setup jest
}