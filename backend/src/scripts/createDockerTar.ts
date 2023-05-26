import crypto from 'crypto'
import fs, { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import shelljs from 'shelljs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const { exec, mkdir, rm } = shelljs

async function writetoStream(stream: fs.WriteStream, megabytes: number) {
  for (let i = 0; i < megabytes; i++) {
    const buffer = crypto.randomBytes(1024 * 1024)

    await new Promise((resolve) => {
      stream.write(buffer, resolve)
    })
  }
}

const NUMBER_OF_FILES = 16
const SIZE_OF_FILE_MBS = 1024

async function main() {
  const baseDirectory = dirname(fileURLToPath(import.meta.url))
  const tempDirectory = join(baseDirectory, 'temp')
  mkdir(tempDirectory)

  const files: Array<string> = []

  for (let i = 0; i < NUMBER_OF_FILES; i++) {
    const filename = `random-${uuidv4()}.bin`
    const stream = fs.createWriteStream(join(tempDirectory, filename))

    await writetoStream(stream, SIZE_OF_FILE_MBS)

    files.push(filename)
  }

  const dockerfile = `
FROM scratch

${files.map((file) => `COPY ${file} ${file}`).join('\n')}
`

  writeFileSync(join(tempDirectory, 'Dockerfile'), dockerfile)

  const name = uuidv4()
  exec(`docker build -t ${name}:latest .`, {
    cwd: tempDirectory,
  })

  const tarDirectory = join(baseDirectory, 'tar')
  mkdir(tarDirectory)

  exec(`docker save ${name}:latest -o ${name}.tar`, {
    cwd: tarDirectory,
  })

  rm('-rf', tempDirectory)
}

main()
