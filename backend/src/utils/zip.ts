import { pick } from 'lodash-es'
import * as Minio from 'minio'
import { PassThrough, Readable } from 'stream'
import yauzl from 'yauzl'

import { MinimalEntry } from '../types/types.js'
import { FileRef } from './build/build.js'

const MAX_FILE_COUNT = 25_000
const MAX_UNCOMPRESSED_FILE_SIZE = 10_000_000

export class MinioRandomAccessReader extends yauzl.RandomAccessReader {
  client: Minio.Client

  file: FileRef

  constructor(client: Minio.Client, file: FileRef) {
    super()

    this.client = client
    this.file = file
  }

  async getSize() {
    const stat = await this.client.statObject(this.file.bucket, this.file.path)

    return stat.size
  }

  _readStreamForRange(start: number, end: number) {
    const passthrough = new PassThrough()

    // Jump into an async context
    ;(async () => {
      const stream = await this.client.getPartialObject(this.file.bucket, this.file.path, start, end - start)
      stream.pipe(passthrough)
      stream.on('close', () => {
        passthrough.end()
      })
    })()

    return passthrough
  }

  async read(buffer: Buffer, offset: number, length: number, position: number, callback: (err: Error | null) => void) {
    const stream = await this.client.getPartialObject(this.file.bucket, this.file.path, position, length)

    let currentOffset = offset
    stream.on('data', (chunk) => {
      for (const i of chunk) {
        // eslint-disable-next-line no-param-reassign
        buffer[currentOffset] = i
        currentOffset += 1
      }
    })
    stream.on('end', () => {
      callback(null)
    })
    stream.on('error', (err: string) => {
      throw new Error(err)
    })
  }

  close(callback: (err: Error | null) => void) {
    /* Do nothing */
    callback(null)
  }
}

export async function listZipFiles(reader: MinioRandomAccessReader): Promise<Array<MinimalEntry>> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const entries: Array<MinimalEntry> = []

    yauzl.fromRandomAccessReader(
      reader,
      await reader.getSize(),
      {
        lazyEntries: true,
      },
      (err, zipfile) => {
        if (err) throw err

        let fileCount = 0

        zipfile.readEntry()
        zipfile.on('entry', (entry) => {
          fileCount += 1

          if (fileCount > MAX_FILE_COUNT) {
            return reject(new Error('Max zip file count reached'))
          }

          entries.push(
            pick(entry, [
              'compressedSize',
              'generalPurposeBitFlag',
              'compressionMethod',
              'relativeOffsetOfLocalHeader',
              'uncompressedSize',
              'fileName',
            ]),
          )

          return zipfile.readEntry()
        })

        zipfile.on('end', () => {
          resolve(entries)
        })
      },
    )
  })
}

export async function getFileStream(reader: MinioRandomAccessReader, minimalEntry: MinimalEntry): Promise<Readable> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    yauzl.fromRandomAccessReader(
      reader,
      await reader.getSize(),
      {
        lazyEntries: true,
      },
      (err, zipfile) => {
        if (err) throw err

        const entry = new yauzl.Entry()
        Object.assign(entry, minimalEntry)

        if (entry.uncompressedSize > MAX_UNCOMPRESSED_FILE_SIZE) {
          return reject(new Error('Reading file that is greater than max file size'))
        }

        return zipfile.openReadStream(entry, (streamError, stream) => {
          if (streamError) throw streamError
          resolve(stream)
        })
      },
    )
  })
}
