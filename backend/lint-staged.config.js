export default {
  '*.ts': ['npx eslint --cache --cache-location node_modules/.cache/eslint/ --max-warnings=0', 'prettier --check'],
}
