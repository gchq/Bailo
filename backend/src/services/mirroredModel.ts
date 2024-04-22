import { createHash } from 'node:crypto'

import archiver from 'archiver'
import stream, { PassThrough } from 'stream'

import { sign } from '../clients/kms.js'
import { putObjectStream } from '../clients/s3.js'
import { ModelAction, ReleaseAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { FileInterfaceDoc, ScanState } from '../models/File.js'
import { ModelDoc } from '../models/Model.js'
import { ReleaseDoc } from '../models/Release.js'
import { UserInterface } from '../models/User.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../utils/error.js'
import { downloadFile, getFilesByIds, getTotalFileSize } from './file.js'
import log from './log.js'
import { getModelById, getModelCardRevisions } from './model.js'
import { getAllFileIds, getReleasesBySemvers } from './release.js'

const ExportKind = {
  ModelCards: 'modelCards',
  Releases: 'releases',
} as const
type ExportKindKeys = (typeof ExportKind)[keyof typeof ExportKind]

type ZipFile = {
  filename: string
  file: archiver.Archiver
  metadata: { modelId: string; exportKind: ExportKindKeys }
}

export async function exportModel(
  user: UserInterface,
  modelId: string,
  disclaimerAgreement: boolean,
  releaseSemvers?: Array<string>,
) {
  if (!config.modelMirror.enabled) {
    throw BadReq('Model mirroring has not been enabled.')
  }
  if (!disclaimerAgreement) {
    throw BadReq('You must agree to the disclaimer agreement before being able to export a model.')
  }
  const model = await getModelById(user, modelId)
  if (!model.settings.mirroredModelId || model.settings.mirroredModelId === '') {
    throw BadReq('The ID of the mirrored model has not been set on this model.')
  }
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, model: model.id })
  }

  const zipFiles: ZipFile[] = []
  zipFiles.push({
    filename: `${modelId}/modelCards.zip`,
    file: await generateModelCardRevisionsZip(user, model),
    metadata: { modelId, exportKind: ExportKind.ModelCards },
  })
  // unknown release semver
  if (releaseSemvers && releaseSemvers.length > 0) {
    zipFiles.push({
      filename: `${modelId}/releases.zip`,
      file: await generateReleaseZip(user, model, releaseSemvers),
      metadata: { modelId, exportKind: ExportKind.Releases },
    })
  }

  return Promise.all(zipFiles.map((zipFile) => uploadZipFileToS3(zipFile)))
}

async function uploadZipFileToS3(zip: ZipFile) {
  const s3Stream = new PassThrough()
  const hashStream = new PassThrough()

  zip.file.pipe(hashStream)
  zip.file.pipe(s3Stream)

  let signatures = {}
  if (config.modelMirror.export.kmsSignature.enabled) {
    const messageDigest = await generateDigest(hashStream)
    // If keys are wrong this returns a horrible error to the user.
    signatures = await sign(messageDigest)
  }

  log.debug('Starting export of zip file to S3.', {
    bucket: config.modelMirror.export.bucket,
    name: zip.filename,
    modelId: zip.metadata.modelId,
    exportKind: zip.metadata.exportKind,
  })
  putObjectStream(config.modelMirror.export.bucket, zip.filename, s3Stream, signatures)
    .then(() =>
      log.debug('Successfully exported zip file to S3.', {
        bucket: config.modelMirror.export.bucket,
        name: zip.filename,
        modelId: zip.metadata.modelId,
        exportKind: zip.metadata.exportKind,
      }),
    )
    .catch((error) =>
      log.error('Failed to export zip file to S3.', {
        error,
        bucket: config.modelMirror.export.bucket,
        name: zip.filename,
        modelId: zip.metadata.modelId,
        exportKind: zip.metadata.exportKind,
      }),
    )
}

async function generateModelCardRevisionsZip(user: UserInterface, model: ModelDoc) {
  const cards = await getModelCardRevisions(user, model.id)

  let zip: archiver.Archiver
  try {
    zip = archiver('zip')
    for (const card of cards) {
      zip.append(JSON.stringify(card.toJSON()), { name: `${card.version}.json` })
    }
    await zip.finalize()
  } catch (error: any) {
    throw InternalError('Error when generating the model card revisions zip file.', { error })
  }
  return zip
}

async function generateReleaseZip(user: UserInterface, model: ModelDoc, semvers: string[]) {
  if (semvers.length > 1) {
    await checkTotalFileSize(model.id, semvers)
  }
  const releases = await getReleasesBySemvers(user, model.id, semvers)

  const zip = archiver('zip')
  const errors: any[] = []
  // Using a .catch here to ensure all errors are returned, rather than just the first error.
  await Promise.all(releases.map((release) => addReleaseToZip(user, model, release, zip).catch((e) => errors.push(e))))
  await zip.finalize()
  if (errors.length > 0) {
    throw InternalError('Error when generating the release zip file.', { errors })
  }
  return zip
}

async function addReleaseToZip(user: UserInterface, model: ModelDoc, release: ReleaseDoc, zip: archiver.Archiver) {
  const auth = await authorisation.release(user, model, release, ReleaseAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId: release.modelId, semver: release.semver })
  }
  const files: FileInterfaceDoc[] = await getFilesByIds(user, release.modelId, release.fileIds)
  const errors: Array<{ message: string; context?: { [key: string]: unknown } }> = []
  const failedFileScans = await checkReleaseFiles(files)
  if (Object.keys(failedFileScans).length > 0) {
    errors.push({
      message: 'All files do not have a successful AV scan.',
      context: { unsuccessfulFiles: failedFileScans },
    })
  }
  if (errors.length > 0) {
    throw BadReq('Unable to export release.', { modelId: release.modelId, semver: release.semver, errors })
  }

  try {
    zip.append(JSON.stringify(release.toJSON()), { name: `${release.semver}/releaseDocument.json` })
    for (const file of files) {
      zip.append(JSON.stringify(file.toJSON()), { name: `${release.semver}/files/${file._id}/fileDocument.json` })
      zip.append((await downloadFile(user, file._id)).Body as stream.Readable, {
        name: `${release.semver}/files/${file._id}/${file.name}`,
      })
    }
  } catch (error: any) {
    throw InternalError('Error when generating the zip file.', { error })
  }
  return zip
}

async function checkTotalFileSize(modelId: string, semvers: string[]) {
  const fileIds = await getAllFileIds(modelId, semvers)
  const totalFileSize = await getTotalFileSize(fileIds)
  if (totalFileSize > config.modelMirror.export.maxSize) {
    throw BadReq('Requested export is too large.', { size: totalFileSize, maxSize: config.modelMirror.export.maxSize })
  }
}

async function checkReleaseFiles(
  files: FileInterfaceDoc[],
): Promise<{ [key: string]: 'Unable to find scan information.' | 'File is infected.' }> {
  return files.reduce((a, file) => {
    if (!file.avScan) {
      return { ...a, [file._id]: 'Unable to find scan information.' }
    }
    if (file.avScan.state !== ScanState.Complete) {
      return { ...a, [file._id]: 'Scan is not complete.' }
    }
    if (file.avScan.isInfected) {
      return { ...a, [file._id]: 'File is infected.' }
    }
    return a
  }, {})
}

async function generateDigest(file: stream.PassThrough) {
  let messageDigest: string
  try {
    const hash = createHash('sha256')
    hash.setEncoding('hex')
    file.pipe(hash)
    messageDigest = await new Promise((resolve) =>
      file.on('end', () => {
        hash.end()
        resolve(hash.read())
      }),
    )
    return messageDigest
  } catch (error: any) {
    throw InternalError('Error when generating the digest for the zip file.', { error })
  }
}
