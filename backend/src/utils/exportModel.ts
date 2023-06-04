import archiver from 'archiver'
import { rm } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

import { findSchemaByRef } from '../services/schema.js'
import { VersionDoc } from '../types/types.js'
import config from './config.js'
import logger from './logger.js'
import { getClient } from './minio.js'
import { NotFound } from './result.js'
import { downloadDockerExport, ImageRef } from './skopeo.js'

export const getDockerFiles = async (modelUuid: string, version: VersionDoc, archive: archiver.Archiver) => {
  const image: ImageRef = {
    namespace: 'internal',
    model: modelUuid,
    version: version.version,
  }

  const filepath = `/tmp/${uuidv4()}`
  await downloadDockerExport(image, filepath, (level, msg) => logger[level](msg))

  archive.file(`${filepath}.tar.gz`, { name: `${modelUuid}.tar.gz` })

  return async () => {
    await rm(`${filepath}.tar.gz`)
  }
}

export const getModelMetadata = async (version: VersionDoc, archive: archiver.Archiver): Promise<VersionDoc> => {
  archive.append(JSON.stringify(version, null, '\t'), { name: 'version.json' })

  return version
}

export const getModelSchema = async (schemaRef: string, archive: archiver.Archiver) => {
  const schema = await findSchemaByRef(schemaRef)
  if (!schema) {
    throw NotFound({ code: 'schema_not_found', schemaRef }, `Unable to find schema '${schemaRef}'`)
  }
  archive.append(JSON.stringify(schema, null, '\t'), { name: 'model_schema.json' })
}

export const getCodeFiles = async (version: VersionDoc, archive: archiver.Archiver) => {
  const bucketName = config.minio.buckets.uploads
  const filePath = version.files.rawCodePath

  const client = getClient()

  if (!filePath) {
    throw NotFound({ filePath }, 'Unknown file type specified')
  }

  const { size } = await client.statObject(bucketName, filePath)
  const codeFile = await client.getObject(bucketName, filePath)

  if (!codeFile) {
    throw NotFound({ code: 'object_fetch_failed', bucketName, filePath }, 'Failed to fetch object from storage')
  }

  logger.info(`Code file fetched from storage - size: ${size}`)
  archive.append(codeFile, { name: 'code.zip' })
}

export const getBinaryFiles = async (version: VersionDoc, archive: archiver.Archiver) => {
  const bucketName = config.minio.buckets.uploads
  const filePath = version.files.rawCodePath

  const client = getClient()

  if (!filePath) {
    throw NotFound({ filePath }, 'Unknown file type specified')
  }

  const { size } = await client.statObject(bucketName, filePath)
  const binaryFile = await client.getObject(bucketName, filePath)

  if (!binaryFile) {
    throw NotFound({ code: 'object_fetch_failed', bucketName, filePath }, 'Failed to fetch object from storage')
  }

  logger.info(`binary file fetched from storage - size: ${size}`)
  archive.append(binaryFile, { name: 'binary.zip' })
}
