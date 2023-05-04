import archiver from 'archiver'
import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import {
  getBinaryFiles,
  getCodeFiles,
  getDockerFiles,
  getModelMetadata as getModelVersion,
  getModelSchema,
} from '../../utils/exportModel.js'
import logger from '../../utils/logger.js'
import { ensureUserRole } from '../../utils/user.js'
import { ModelUploadType } from '@bailo/shared'

export const exportModel = [
  ensureUserRole('user'),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    // Get model params
    const { uuid, version, deploymentId } = req.params

    // Set .zip extension to request header
    res.set('Content-disposition', `attachment; filename=${uuid}.zip`)
    res.set('Content-Type', 'application/zip')
    res.set('Cache-Control', 'private, max-age=604800, immutable')
    const archive = archiver('zip')
    // Look into an actual tar.gz (node-tar)
    const dockerTar = archiver('tar', {
      gzip: true,
      gzipOptions: {
        level: 1
      }
    })

    dockerTar.on('error', (err) => {
      logger.error(err, `Errored during archiving.`)
      throw err
    })

    archive.on('error', (err) => {
      logger.error(err, `Errored during archiving.`)
      throw err
    })
    archive.pipe(res)
    archive.append(dockerTar, { name: `${uuid}.tar.gz` })

    const modelVersion = await getModelVersion(req.user, uuid, version, archive)
    await getModelSchema(modelVersion.metadata.schemaRef, archive)

    if (modelVersion.metadata.buildOptions?.uploadType === ModelUploadType.Zip) {
      await getCodeFiles(deploymentId, version, req.user, archive)
      await getBinaryFiles(deploymentId, version, req.user, archive)
    }

    if (ModelUploadType.Docker || (ModelUploadType.ModelCard && modelVersion.built)) {
      await getDockerFiles(uuid, version, dockerTar)
    }

    dockerTar.finalize()
    archive.finalize()
  },
]
