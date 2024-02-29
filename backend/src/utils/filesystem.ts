import fs, { constants } from 'fs'
import { access, mkdir, readdir } from 'fs/promises'

export function ensurePathExists(path: string, sync = false) {
  if (sync) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true })
    }
    return
  }

  access(path, constants.F_OK).catch(() => mkdir(path))
}

export function checkFileExists(file: string) {
  return access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

export async function getFilesInDir(path: string) {
  return (
    await readdir(path, {
      withFileTypes: true,
    })
  ).filter((item) => item.isFile())
}
