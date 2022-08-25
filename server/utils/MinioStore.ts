import { Request } from 'express'
import * as Minio from 'minio'
import logger from './logger'

export default class MinioStore {
  bucket: (req: Request, file: any) => string
  path: (req: Request, file: any) => string
  connection: Minio.ClientOptions
  client: Minio.Client

  constructor({
    connection,
    bucket,
    path,
  }: {
    connection: Minio.ClientOptions
    bucket: (req: Request, file: any) => string
    path: (req: Request, file: any) => string
  }) {
    this.bucket = bucket
    this.path = path
    this.connection = connection

    this.client = new Minio.Client(this.connection)
  }

  async _handleFile(req: Request, file: any, cb: (err: string | undefined, metadata: any) => void) {
    const bucket = await this.bucket(req, file)
    const path = await this.path(req, file)

    logger.info({ bucket, path }, 'Uploading file to Minio')

    try {
      await this.client.putObject(bucket, path, file.stream)
      logger.info({ bucket, path }, 'Finished uploading file to Minio')
    } catch (e) {
      logger.error({ error: e }, 'Unable to add file to Minio')
      return cb(e, null)
    }

    cb(undefined, {
      ...{
        path,
        bucket,
      },
    })
  }

  async _removeFile(_req: Request, file: any, cb: (err: string | undefined, data: any) => void) {
    logger.info({ bucket: file.bucket, path: file.path }, 'Removing file from Minio')
    try {
      await this.client.removeObject(file.bucket, file.path)
    } catch (e) {
      logger.error({ error: e }, 'Unable to remove file from Minio')
      return cb(e, null)
    }

    logger.info({ bucket: file.bucket, path: file.path }, 'Successfully removed file from Minio')
    return cb(undefined, null)
  }
}
