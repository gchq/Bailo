import { fileURLToPath } from 'url'

export function getDirectory(importUrl: string) {
  return fileURLToPath(new URL('.', importUrl))
}
