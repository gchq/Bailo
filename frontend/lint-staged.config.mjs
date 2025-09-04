import { relative } from 'path'

const buildEslintCommand = (filenames) =>
  `eslint --max-warnings 0 ${filenames.map((fileName) => relative(`${process.cwd()}/frontend`, fileName)).join(' ')}`

const config = {
  '**/*.{ts,tsx,md}': [buildEslintCommand],
  '**/*.{ts,tsx,md,mdx}': ['prettier --check'],
}

export default config
