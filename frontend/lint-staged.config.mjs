export default {
  '**/*.{ts,tsx,md}': ['npx eslint --cache --cache-location node_modules/.cache/eslint/ --max-warnings 0'],
  '**/*.{ts,tsx,md,mdx}': ['prettier --check'],
}
