// jest.config.js
export default {
	transform: {
		'^.+\\.m?js$': 'babel-jest',
		'^.+\\.json$': 'babel-jest'
	},
	testEnvironment: 'jsdom',
	moduleFileExtensions: ['js', 'mjs'],
	testMatch: ['**/*.spec.mjs'],	transformIgnorePatterns: [
		'/node_modules/(?!lodash-es/).+\\.js$',
		'/node_modules/(?!@org\\/pkg1|@org\\/pkg2).+\\.mjs$'
	],
	extensionsToTreatAsEsm: [],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1'
	},
	testEnvironmentOptions: {
		customExportConditions: ['node', 'node-addons']
	}
};
