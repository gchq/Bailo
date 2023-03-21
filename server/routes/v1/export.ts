
import archiver from 'archiver'
import { Request, Response } from 'express'
import bodyParser from 'body-parser'
import { ensureUserRole } from '../../utils/user'
import logger from '../../utils/logger'
import { getDockerFiles, getModelMetadata } from 'server/utils/exportModel'

export const exportModel = [
    ensureUserRole('user'),
    bodyParser.json(),
    async (req: Request, res: Response) => {
        // Get model params
        const { uuid, version } = req.params
        
        // Set .zip extension to request header
        res.set('Content-disposition', `attachment; filename=${uuid}.zip`)
        res.set('Content-Type', 'application/zip')
        res.set('Cache-Control', 'private, max-age=604800, immutable')
        const archive = archiver('zip')

        
        archive.on('error', (err) => {
            logger.error(err, `Errored during archiving.`)
            throw err
        })
        archive.pipe(res);

        // Get Metadata
        await getModelMetadata(req.user, uuid, version, archive);
        // Get Model Schema information

        // Get Code bundle

        // Get Binaries bundle

        // Get Docker Files from registry
        await getDockerFiles(req.user.id, uuid, version, archive)
        // Bundle all information into .zip/.tar


        // Send bundled file 
        archive.finalize()
        
    }
]
