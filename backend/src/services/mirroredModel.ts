import { createHash } from 'node:crypto'

import archiver from 'archiver'
import { PassThrough } from 'stream'

import { putObjectStream } from '../clients/s3.js'
import { ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { UserInterface } from '../models/User.js'
import { Forbidden } from '../utils/error.js'
import log from './log.js'
import { getModelById, getModelCardRevisions } from './model.js'

export async function exportModelCardRevisions(user: UserInterface, modelId: string) {
  const model = await getModelById(user, modelId)
  const cards = await getModelCardRevisions(user, modelId)
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  try {
    const zip = archiver('zip')
    for (const card of cards) {
      zip.append(JSON.stringify(card.toJSON()), { name: `${card.version}` })
    }
    zip.finalize()

    const s3Stream = new PassThrough()
    const hashStream = new PassThrough()

    zip.pipe(hashStream)
    zip.pipe(s3Stream)

    const hash = createHash('sha256')
    hash.setEncoding('hex')
    hashStream.pipe(hash)
    const signature: string = await new Promise((resolve) =>
      hashStream.on('end', () => {
        hash.end()
        resolve(hash.read())
      }),
    )

    await putObjectStream('exports', `${modelId}.zip`, s3Stream, { signature })
  } catch (error: any) {
    log.error(`Error in generateAndStreamZipfileToS3 ::: ${error.message}`)
  }
}
