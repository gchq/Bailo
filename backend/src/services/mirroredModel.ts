import { createHash } from 'node:crypto'

import archiver from 'archiver'
import stream, { PassThrough, Readable } from 'stream'

import { sign } from '../clients/kms.js'
import { copyObject, getObjectStream, putObjectStream } from '../clients/s3.js'
import { ModelAction } from '../connectors/authorisation/actions.js'
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
import { getAllFileIds, getReleasesForExport } from './release.js'

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
  if (releaseSemvers && releaseSemvers.length > 1) {
    await checkTotalFileSize(model.id, releaseSemvers)
  }
  log.debug('Request checks complete')

  const zip = archiver('zip')
  const s3Stream = new PassThrough()
  zip.pipe(s3Stream)

  const s3UploadLocations = {
    temporary: { bucket: config.s3.buckets.uploads, object: `exportQueue/${model.id}.zip` },
    export: { bucket: config.modelMirror.export.bucket, object: `${model.id}.zip` },
  }
  if (config.modelMirror.export.kmsSignature.enabled) {
    log.debug('Using signatures. Uploading to temporary S3 location first.')
    putObjectStream(config.s3.buckets.uploads, `exportQueue/${model.id}.zip`, s3Stream)
    s3Stream.on('end', async () => await uploadToExportBucket(s3UploadLocations))
  } else {
    log.debug('Signatures not enabled. Uploading to export S3 location.')
    putObjectStream(config.modelMirror.export.bucket, `${model.id}.zip`, s3Stream)
  }
  try {
    await addModelCardRevisionsToZip(user, model, zip)
  } catch (error) {
    throw InternalError('Error when adding the model card revisions to the zip file.', { error })
  }
  try {
    if (releaseSemvers && releaseSemvers.length > 0) {
      await addReleasesToZip(user, model, releaseSemvers, zip)
    }
  } catch (error) {
    throw InternalError('Error when adding the model card revisions to the zip file.', { error })
  }
  zip.finalize()
}

async function uploadToExportBucket(s3Locations: {
  temporary: { bucket: string; object: string }
  export: { bucket: string; object: string }
}) {
  let signatures = {}
  const sourceStream = (await getObjectStream(s3Locations.temporary.bucket, s3Locations.temporary.object))
    .Body as Readable
  const messageDigest = await generateDigest(sourceStream)
  signatures = await sign(messageDigest)
  await copyObject(
    s3Locations.temporary.bucket,
    s3Locations.temporary.object,
    s3Locations.export.bucket,
    s3Locations.export.object,
    signatures,
  )
}

async function addModelCardRevisionsToZip(user: UserInterface, model: ModelDoc, zip: archiver.Archiver) {
  log.debug('Generating zip file of model card revisions.', { user, modelId: model.id })
  const cards = await getModelCardRevisions(user, model.id)
  for (const card of cards) {
    zip.append(JSON.stringify(card.toJSON()), { name: `${card.version}.json` })
  }
  log.debug('Finished generating zip file of model card revisions.', { user, modelId: model.id })
}

async function addReleasesToZip(user: UserInterface, model: ModelDoc, semvers: string[], zip: archiver.Archiver) {
  log.debug('Adding releases to zip file', { user, modelId: model.id, semvers })
  const releases = await getReleasesForExport(user, model.id, semvers)

  const errors: any[] = []
  // Using a .catch here to ensure all errors are returned, rather than just the first error.
  await Promise.all(releases.map((release) => addReleaseToZip(user, model, release, zip).catch((e) => errors.push(e))))
  if (errors.length > 0) {
    throw InternalError('Error when generating the release zip file.', { errors })
  }
  log.debug('Completed generating zip file of releases.', { user, modelId: model.id, semvers })
  return zip
}

async function addReleaseToZip(user: UserInterface, model: ModelDoc, release: ReleaseDoc, zip: archiver.Archiver) {
  log.debug('Adding release to zip file of releases.', { user, modelId: model.id, semver: release.semver })
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

  const baseUri = `releases/${release.semver}`
  try {
    zip.append(JSON.stringify(release.toJSON()), { name: `${baseUri}/releaseDocument.json` })
    for (const file of files) {
      zip.append(JSON.stringify(file.toJSON()), { name: `${baseUri}/files/${file._id}/fileDocument.json` })
      zip.append((await downloadFile(user, file._id)).Body as stream.Readable, {
        name: `${baseUri}/files/${file._id}/${file.name}`,
      })
    }
  } catch (error: any) {
    throw InternalError('Error when generating the zip file.', { error })
  }
  log.debug('Finished adding release to zip file of releases.', { user, modelId: model.id, semver: release.semver })
  return zip
}

async function checkTotalFileSize(modelId: string, semvers: string[]) {
  const fileIds = await getAllFileIds(modelId, semvers)
  if (fileIds.length === 0) {
    return
  }
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

async function generateDigest(file: Readable) {
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
