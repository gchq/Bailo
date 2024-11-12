import _ from 'lodash'

import FileModel from '../models/File.js'

export async function up() {
  const files = await FileModel.find()
  files.forEach(async (file) => {
    const newAvScanResult = _.cloneDeep(file.avScan)
    file.avScan = newAvScanResult
    await file.save()
  })
}

export async function down() {
  /* NOOP */
}
