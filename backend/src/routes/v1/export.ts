import archiver from 'archiver'
import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import {
  getBinaryFiles,
  getCodeFiles,
  getDockerFiles,
  getModelMetadata,
  getModelSchema,
} from '../../utils/exportModel.js'
import logger from '../../utils/logger.js'
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
    res.set('Cache-Control', 'private, max-age=604800, immutable')
    const archive = archiver('zip')
    const dockerTar = archiver('zip')

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

    // Get Metadata
    const { metadata } = await getModelMetadata(req.user, uuid, version, archive)
    // Get Model Schema information
    await getModelSchema(metadata.schemaRef, archive)

    // Get Code bundle
    await getCodeFiles(deploymentId, version, req.user, archive)

    // Get Binaries bundle
    await getBinaryFiles(deploymentId, version, req.user, archive)

    // Get Docker Files from registry
    await getDockerFiles(uuid, version, dockerTar)
    // Bundle all information into .zip/.tar

    // Send bundled file
    dockerTar.finalize()
    archive.finalize()
  },
]
