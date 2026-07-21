const eslintBin = `${process.cwd()}/frontend/node_modules/.bin/eslint`

const buildEslintCommand = (filenames) =>
  `${eslintBin} --cache --cache-location frontend/node_modules/.cache/eslint/ --max-warnings 0 ${filenames.join(' ')}`

const config = {
  '**/*.{ts,tsx,md}': [buildEslintCommand],
  '**/*.{ts,tsx,md,mdx}': ['prettier --check'],
}

export default config
