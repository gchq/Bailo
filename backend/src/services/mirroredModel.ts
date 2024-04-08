import { createHash } from 'node:crypto'

import archiver from 'archiver'
import { PassThrough } from 'stream'

import { putObjectStream } from '../clients/s3.js'
import { ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { UserInterface } from '../models/User.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../utils/error.js'
import { getModelById, getModelCardRevisions } from './model.js'

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
      zip.append(JSON.stringify(card.toJSON()), { name: `${card.version}` })
    }
    zip.finalize()
  } catch (error: any) {
    throw InternalError('Error when generating the zip file.', { error })
  }

  const s3Stream = new PassThrough()
  const hashStream = new PassThrough()

  zip.pipe(hashStream)
  zip.pipe(s3Stream)

  let signature: string
  try {
    const hash = createHash('sha256')
    hash.setEncoding('hex')
    hashStream.pipe(hash)
    signature = await new Promise((resolve) =>
      hashStream.on('end', () => {
        hash.end()
        resolve(hash.read())
      }),
    )
  } catch (error: any) {
    throw InternalError('Error when generating the signature for the zip file.', { error })
  }

  await putObjectStream(config.modelMirror.export.bucket, `${modelId}/modelCards.zip`, s3Stream, { signature })
}
