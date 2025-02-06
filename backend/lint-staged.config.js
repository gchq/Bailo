export default {
  '*.ts': ["eslint . -c eslint.config.mjs '**/*.ts' --max-warnings=0", 'prettier --check'],
}
