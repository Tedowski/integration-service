/* eslint-disable */
require('dotenv').config({ path: '.env.test' });

const config = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	testEnvironment: 'node',
	verbose: true,
	passWithNoTests: true,
	setupFiles: [__dirname + '/jest.setup.js'],
	coverageReporters: ['cobertura', 'text-summary', 'lcov'],
	workerIdleMemoryLimit: '1GB',
	modulePathIgnorePatterns: ['/dist/'],
};

module.exports = config;
