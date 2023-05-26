import archiver from 'archiver'
import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { ModelUploadType } from '../../types/types.js'
import {
  getBinaryFiles,
  getCodeFiles,
  getDockerFiles,
  getModelMetadata as getModelVersion,
  getModelSchema,
} from '../../utils/exportModel.js'
import { InternalServer } from '../../utils/result.js'
import { ensureUserRole } from '../../utils/user.js'

export const exportModel = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    // Get model params
    const { uuid, version, deploymentId } = req.params

    // Set .zip extension to request header
    res.set('Content-disposition', `attachment; filename=${uuid}.zip`)
    res.set('Content-Type', 'application/zip')

    const archive = archiver('zip')

    archive.on('error', (err) => {
      throw InternalServer(
        {
          err,
          uuid,
          version,
          deploymentId,
        },
        'Errored during artefact bundling'
      )
    })

    archive.pipe(res)

    const modelVersion = await getModelVersion(req.user, uuid, version, archive)
    await getModelSchema(modelVersion.metadata.schemaRef, archive)

    const uploadType = modelVersion.metadata.buildOptions?.uploadType

    if (uploadType === ModelUploadType.Zip) {
      await getCodeFiles(deploymentId, version, req.user, archive)
      await getBinaryFiles(deploymentId, version, req.user, archive)
    }

    if (uploadType === ModelUploadType.Docker || (uploadType === ModelUploadType.Zip && modelVersion.built)) {
      const tidyUp = await getDockerFiles(uuid, version, archive)

      archive.on('end', async () => {
        await tidyUp()
      })
    }

    await archive.finalize()
  },
]
