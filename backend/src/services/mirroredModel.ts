import { createHash } from 'node:crypto'

import archiver from 'archiver'
import stream, { PassThrough } from 'stream'

import { sign } from '../clients/kms.js'
import { putObjectStream } from '../clients/s3.js'
import { ModelAction, ReleaseAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { FileInterfaceDoc, ScanState } from '../models/File.js'
import { UserInterface } from '../models/User.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../utils/error.js'
import { downloadFile, getFilesByIds } from './file.js'
import { getModelById, getModelCardRevisions } from './model.js'
import { getReleaseBySemver } from './release.js'

export async function exportModelCardRevisions(user: UserInterface, modelId: string, disclaimerAgreement: boolean) {
  if (!config.modelMirror.enabled) {
    throw BadReq('Model mirroring has not been enabled.')
  }
  const model = await getModelById(user, modelId)
  const cards = await getModelCardRevisions(user, modelId)
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  const errors: Array<string> = []
  if (!disclaimerAgreement) {
    errors.push('You must agree to the disclaimer agreement before being able to export a model.')
  }
  if (errors.length > 0) {
    throw BadReq('Unable to export model card.', { errors })
  }

  let zip: archiver.Archiver
  try {
    zip = archiver('zip')
    for (const card of cards) {
      zip.append(JSON.stringify(card.toJSON()), { name: `${card.version}.json` })
    }
    zip.finalize()
  } catch (error: any) {
    throw InternalError('Error when generating the zip file.', { error })
  }

  const s3Stream = new PassThrough()
  const hashStream = new PassThrough()

  zip.pipe(hashStream)
  zip.pipe(s3Stream)

  const messageDigest = await generateDigest(hashStream)

  let signatures = {}
  if (config.modelMirror.export.kmsSignature.enabled) {
    signatures = await sign(messageDigest)
  }
  await putObjectStream(config.modelMirror.export.bucket, `${modelId}/modelCards.zip`, s3Stream, signatures)
}

export async function exportRelease(
  user: UserInterface,
  modelId: string,
  semver: string,
  disclaimerAgreement: boolean,
) {
  if (!config.modelMirror.enabled) {
    throw BadReq('Model mirroring has not been enabled.')
  }
  const model = await getModelById(user, modelId)
  const release = await getReleaseBySemver(user, modelId, semver)
  const files: FileInterfaceDoc[] = await getFilesByIds(user, modelId, release.fileIds)
  const auth = await authorisation.release(user, model, release, ReleaseAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId, semver })
  }

  //Check in the export bucket if the model cards have already been exported?
  const errors: Array<{ message: string; context?: { [key: string]: unknown } }> = []
  const failedFileScans = await checkReleaseFiles(files)
  if (!disclaimerAgreement) {
    errors.push({ message: 'You must agree to the disclaimer agreement before being able to export a release.' })
  }
  if (Object.keys(failedFileScans).length > 0) {
    errors.push({
      message: 'All files do not have a successful AV scan.',
      context: { unsuccessfulFiles: failedFileScans },
    })
  }
  if (errors.length > 0) {
    throw BadReq('Unable to export release.', { errors })
  }

  let zip: archiver.Archiver
  try {
    zip = archiver('zip')
    zip.append(JSON.stringify(release.toJSON()), { name: `releaseDocument.json` })
    for (const file of files) {
      zip.append(JSON.stringify(file.toJSON()), { name: `files/${file._id}/fileDocument.json` })
      zip.append((await downloadFile(user, file._id)).Body as stream.Readable, {
        name: `files/${file._id}/${file.name}`,
      })
    }
    zip.finalize()
  } catch (error: any) {
    throw InternalError('Error when generating the zip file.', { error })
  }

  const s3Stream = new PassThrough()
  const hashStream = new PassThrough()

  zip.pipe(hashStream)
  zip.pipe(s3Stream)

  const messageDigest = await generateDigest(hashStream)

  let signatures = {}
  if (config.modelMirror.export.kmsSignature.enabled) {
    signatures = await sign(messageDigest)
  }
  await putObjectStream(config.modelMirror.export.bucket, `${modelId}/${release.semver}.zip`, s3Stream, signatures)
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
    throw InternalError('Error when generating the signature for the zip file.', { error })
  }
}
