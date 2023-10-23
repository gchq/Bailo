import { relative } from 'path'

const buildEslintCommand = (filenames) =>
  `next lint --max-warnings 0 --file ${filenames
    .map((fileName) => relative(`${process.cwd()}/frontend`, fileName))
    .join(' --file ')}`

const config = {
  '**/*.{ts,tsx,md,mdx}': [buildEslintCommand, 'prettier --check'],
}

export default config
