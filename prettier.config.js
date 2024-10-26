/** @type {import('prettier').Config} */

module.exports = {
	singleQuote: false,
	semi: true,
	bracketSpacing: true,
	trailingComma: 'all',
	printWidth: 100,
	tabWidth: 2,
	useTabs: true,
	endOfLine: 'lf',

	plugins: ['prettier-plugin-tailwindcss'],
	tailwindFunctions: ['cn', 'cva'],
}
