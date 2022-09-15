import { dirname } from 'path'
import fs, { constants } from 'fs'
import { access, mkdir, readdir } from 'fs/promises'

export function ensurePathExists(path: string, sync = false) {
  const folder = dirname(path)

  if (sync) {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true })
    }
    return
  }

  access(path, constants.F_OK).catch(() => mkdir(path))
}

export async function getFilesInDir(path: string) {
  return (
    await readdir(path, {
      withFileTypes: true,
    })
  ).filter((item) => item.isFile())
}
