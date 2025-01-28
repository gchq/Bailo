export default {
  '*.ts': ["eslint . -c eslint.config.mjs '**/*.{ts,tsx}' --max-warnings=0", 'prettier --check'],
}
