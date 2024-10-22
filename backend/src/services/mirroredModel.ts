import { createHash } from 'node:crypto'

import archiver from 'archiver'
import * as fflate from 'fflate'
import fetch, { Response } from 'node-fetch'
import prettyBytes from 'pretty-bytes'
import stream, { PassThrough, Readable } from 'stream'

import { sign } from '../clients/kms.js'
import { getObjectStream, putObjectStream } from '../clients/s3.js'
import { ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import scanners from '../connectors/fileScanning/index.js'
import { FileInterfaceDoc, ScanState } from '../models/File.js'
import { ModelDoc } from '../models/Model.js'
import { ModelCardRevisionInterface } from '../models/ModelCardRevision.js'
import { ReleaseDoc } from '../models/Release.js'
import { UserInterface } from '../models/User.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../utils/error.js'
import { downloadFile, getFilesByIds, getTotalFileSize } from './file.js'
import log from './log.js'
import {
  getModelById,
  getModelCardRevisions,
  isModelCardRevision,
  saveImportedModelCard,
  setLatestImportedModelCard,
} from './model.js'
import { getAllFileIds, getReleasesForExport } from './release.js'

export async function exportModel(
  user: UserInterface,
  modelId: string,
  disclaimerAgreement: boolean,
  semvers?: Array<string>,
) {
  if (!config.ui.modelMirror.enabled) {
    throw BadReq('Model mirroring has not been enabled.')
  }
  if (!disclaimerAgreement) {
    throw BadReq('You must agree to the disclaimer agreement before being able to export a model.')
  }
  const model = await getModelById(user, modelId)
  if (!model.settings.mirror.destinationModelId) {
    throw BadReq(`The 'Destination Model ID' has not been set on this model.`)
  }
  const mirroredModelId = model.settings.mirror.destinationModelId
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, model: model.id })
  }
  if (semvers && semvers.length > 0) {
    await checkReleaseFiles(user, model.id, semvers)
  }
  log.debug('Request checks complete')

  const zip = archiver('zip')
  const s3Stream = new PassThrough()
  zip.pipe(s3Stream)

  if (config.modelMirror.export.kmsSignature.enabled) {
    log.debug({ modelId, semvers }, 'Using signatures. Uploading to temporary S3 location first.')
    uploadToTemporaryS3Location(modelId, semvers, s3Stream).then(() =>
      copyToExportBucketWithSignatures(modelId, semvers, mirroredModelId, user.dn).catch((error) =>
        log.error({ modelId, semvers, error }, 'Failed to upload export to export location with signatures'),
      ),
    )
  } else {
    log.debug({ modelId, semvers }, 'Signatures not enabled. Uploading to export S3 location.')
    uploadToExportS3Location(modelId, semvers, s3Stream, { modelId, mirroredModelId })
  }

  try {
    await addModelCardRevisionsToZip(user, model, zip)
  } catch (error) {
    throw InternalError('Error when adding the model card revision(s) to the zip file.', { error })
  }
  try {
    if (semvers && semvers.length > 0) {
      await addReleasesToZip(user, model, semvers, zip)
    }
  } catch (error) {
    throw InternalError('Error when adding the release(s) to the zip file.', { error })
  }
  zip.finalize()
  log.debug({ modelId, semvers }, 'Successfully finalized zip file.')
}

export async function importModel(_user: UserInterface, mirroredModelId: string, payloadUrl: string) {
  if (mirroredModelId === '') {
    throw BadReq('Missing mirrored model ID.')
  }
  let sourceModelId

  log.info({ mirroredModelId, payloadUrl }, 'Received a request to import a model.')

  let res: Response
  try {
    res = await fetch(payloadUrl)
  } catch (err) {
    throw InternalError('Unable to get the file.', { err, payloadUrl })
  }
  if (!res.ok) {
    throw InternalError('Unable to get zip file.', {
      payloadUrl,
      response: { status: res.status, body: await res.text() },
    })
  }

  if (!res.body) {
    throw InternalError('Unable to get the file.', { payloadUrl })
  }

  log.info({ mirroredModelId, payloadUrl }, 'Obtained the file from the payload URL.')

  const modelCards: ModelCardRevisionInterface[] = []
  const zipData = new Uint8Array(await res.arrayBuffer())
  let zipContent
  try {
    zipContent = fflate.unzipSync(zipData, {
      filter(file) {
        return /[0-9]+.json/.test(file.name)
      },
    })
  } catch (error) {
    log.error({ error }, 'Unable to read zip file.')
    throw InternalError('Unable to read zip file.', { mirroredModelId })
  }
  Object.keys(zipContent).forEach(function (key) {
    const { modelCard, sourceModelId: newSourceModelId } = parseModelCard(
      Buffer.from(zipContent[key]).toString('utf8'),
      mirroredModelId,
      sourceModelId,
    )
    if (!sourceModelId) {
      sourceModelId = newSourceModelId
    }
    modelCards.push(modelCard)
  })

  log.info({ mirroredModelId, payloadUrl, sourceModelId }, 'Finished parsing the collection of model cards.')

  await Promise.all(modelCards.map((card) => saveImportedModelCard(card, sourceModelId)))
  await setLatestImportedModelCard(mirroredModelId)
  log.info(
    { mirroredModelId, payloadUrl, sourceModelId, modelCardVersions: modelCards.map((modelCard) => modelCard.version) },
    'Finished importing the collection of model cards.',
  )

  return { mirroredModelId, sourceModelId, modelCardVersions: modelCards.map((modelCard) => modelCard.version) }
}

function parseModelCard(modelCardJson: string, mirroredModelId: string, sourceModelId?: string) {
  const modelCard = JSON.parse(modelCardJson)
  if (!isModelCardRevision(modelCard)) {
    throw InternalError('Data cannot be converted into a model card.')
  }
  const modelId = modelCard.modelId
  modelCard.modelId = mirroredModelId
  delete modelCard['_id']
  if (!sourceModelId) {
    return { modelCard, sourceModelId: modelId }
  }
  if (sourceModelId !== modelId) {
    throw InternalError('Zip file contains model cards for multiple models.', { modelIds: [sourceModelId, modelId] })
  }
  return { modelCard }
}

async function copyToExportBucketWithSignatures(
  modelId: string,
  semvers: string[] | undefined,
  mirroredModelId: string,
  exporter: string,
) {
  let signatures = {}
  log.debug({ modelId, semvers }, 'Getting stream from S3 to generate signatures.')
  const streamForDigest = await getObjectFromTemporaryS3Location(modelId, semvers)
  const messageDigest = await generateDigest(streamForDigest)
  log.debug({ modelId, semvers }, 'Generating signatures.')
  try {
    signatures = await sign(messageDigest)
  } catch (e) {
    log.error({ modelId }, 'Error generating signature for export.')
    throw e
  }
  log.debug({ modelId, semvers }, 'Successfully generated signatures')
  log.debug({ modelId, semvers }, 'Getting stream from S3 to upload to export location.')
  const streamToCopy = await getObjectFromTemporaryS3Location(modelId, semvers)
  await uploadToExportS3Location(modelId, semvers, streamToCopy, {
    modelId,
    mirroredModelId,
    exporter,
    ...signatures,
  })
}

async function uploadToTemporaryS3Location(
  modelId: string,
  semvers: string[] | undefined,
  stream: Readable,
  metadata?: Record<string, string>,
) {
  const bucket = config.s3.buckets.uploads
  const object = `exportQueue/${modelId}.zip`
  try {
    await putObjectStream(bucket, object, stream, metadata)
    log.debug(
      {
        bucket,
        object,
        modelId,
        semvers,
      },
      'Successfully uploaded export to temporary S3 location.',
    )
  } catch (error) {
    log.error(
      {
        bucket,
        object,
        modelId,
        semvers,
        error,
      },
      'Failed to export to temporary S3 location.',
    )
  }
}

async function getObjectFromTemporaryS3Location(modelId: string, semvers: string[] | undefined) {
  const bucket = config.s3.buckets.uploads
  const object = `exportQueue/${modelId}.zip`
  try {
    const stream = (await getObjectStream(bucket, object)).Body as Readable
    log.debug(
      {
        bucket,
        object,
        modelId,
        semvers,
      },
      'Successfully retrieved stream from temporary S3 location.',
    )
    return stream
  } catch (error) {
    log.error(
      {
        bucket,
        object,
        modelId,
        semvers,
        error,
      },
      'Failed to retrieve stream from temporary S3 location.',
    )
    throw error
  }
}

async function uploadToExportS3Location(
  modelId: string,
  semvers: string[] | undefined,
  stream: Readable,
  metadata?: Record<string, string>,
) {
  const bucket = config.modelMirror.export.bucket
  const object = `${modelId}.zip`
  try {
    await putObjectStream(bucket, object, stream, metadata)
    log.debug(
      {
        bucket,
        object,
        modelId,
        semvers,
      },
      'Successfully uploaded export to export S3 location.',
    )
  } catch (error) {
    log.error(
      {
        bucket,
        object,
        modelId,
        semvers,
        error,
      },
      'Failed to export to export S3 location.',
    )
  }
}

async function addModelCardRevisionsToZip(user: UserInterface, model: ModelDoc, zip: archiver.Archiver) {
  log.debug({ user, modelId: model.id }, 'Generating zip file of model card revisions.')
  const cards = await getModelCardRevisions(user, model.id)
  for (const card of cards) {
    zip.append(JSON.stringify(card.toJSON()), { name: `${card.version}.json` })
  }
  log.debug({ user, modelId: model.id }, 'Finished generating zip file of model card revisions.')
}

async function addReleasesToZip(user: UserInterface, model: ModelDoc, semvers: string[], zip: archiver.Archiver) {
  log.debug({ user, modelId: model.id, semvers }, 'Adding releases to zip file')
  const releases = await getReleasesForExport(user, model.id, semvers)

  const errors: any[] = []
  // Using a .catch here to ensure all errors are returned, rather than just the first error.
  await Promise.all(releases.map((release) => addReleaseToZip(user, model, release, zip).catch((e) => errors.push(e))))
  if (errors.length > 0) {
    throw InternalError('Error when generating the release zip file.', { errors })
  }
  log.debug({ user, modelId: model.id, semvers }, 'Completed generating zip file of releases.')
  return zip
}

async function addReleaseToZip(user: UserInterface, model: ModelDoc, release: ReleaseDoc, zip: archiver.Archiver) {
  log.debug('Adding release to zip file of releases.', { user, modelId: model.id, semver: release.semver })
  const files: FileInterfaceDoc[] = await getFilesByIds(user, release.modelId, release.fileIds)

  const baseUri = `releases/${release.semver}`
  try {
    zip.append(JSON.stringify(release.toJSON()), { name: `${baseUri}/releaseDocument.json` })
    for (const file of files) {
      zip.append(JSON.stringify(file.toJSON()), { name: `${baseUri}/files/${file._id}/fileDocument.json` })
      zip.append((await downloadFile(user, file._id)).Body as stream.Readable, {
        name: `${baseUri}/files/${file._id}/fileContent`,
      })
    }
  } catch (error: any) {
    throw InternalError('Error when generating the zip file.', { error })
  }
  log.debug({ user, modelId: model.id, semver: release.semver }, 'Finished adding release to zip file of releases.')
  return zip
}

async function checkReleaseFiles(user: UserInterface, modelId: string, semvers: string[]) {
  const fileIds = await getAllFileIds(modelId, semvers)
  // Check the total size of the export if more than one release is being exported
  if (semvers.length > 1) {
    if (fileIds.length === 0) {
      return
    }
    const totalFileSize = await getTotalFileSize(fileIds)
    log.debug(
      { modelId, semvers, size: prettyBytes(totalFileSize) },
      'Calculated estimated total file size included in export.',
    )
    if (totalFileSize > config.modelMirror.export.maxSize) {
      throw BadReq('Requested export is too large.', {
        size: totalFileSize,
        maxSize: config.modelMirror.export.maxSize,
      })
    }
  }

  if (scanners.info()) {
    const files: FileInterfaceDoc[] = await getFilesByIds(user, modelId, fileIds)
    const scanErrors: {
      missingScan: Array<{ name: string; id: string }>
      incompleteScan: Array<{ name: string; id: string }>
      failedScan: Array<{ name: string; id: string }>
    } = { missingScan: [], incompleteScan: [], failedScan: [] }
    for (const file of files) {
      if (!file.avScan) {
        scanErrors.missingScan.push({ name: file.name, id: file.id })
      } else if (file.avScan.some((scanResult) => scanResult.state !== ScanState.Complete)) {
        scanErrors.incompleteScan.push({ name: file.name, id: file.id })
      } else if (file.avScan.some((scanResult) => scanResult.isInfected)) {
        scanErrors.failedScan.push({ name: file.name, id: file.id })
      }
    }
    if (scanErrors.missingScan.length > 0 || scanErrors.incompleteScan.length > 0 || scanErrors.failedScan.length > 0) {
      throw BadReq('The releases contain file(s) that do not have a clean AV scan.', { scanErrors })
    }
  }
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
