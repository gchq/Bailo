const eslintBin = `${process.cwd()}/backend/node_modules/.bin/eslint`

export default {
  '*.ts': [
    `${eslintBin} --cache --cache-location backend/node_modules/.cache/eslint/ --max-warnings=0`,
    'prettier --check',
  ],
}
