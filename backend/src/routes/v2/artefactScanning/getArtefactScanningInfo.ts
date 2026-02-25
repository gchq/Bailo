import { Request, Response } from 'express'

import { ArtefactScanningConnectorInfo } from '../../../connectors/artefactScanning/Base.js'
import scanners from '../../../connectors/artefactScanning/index.js'
import { z } from '../../../lib/zod.js'
import { artefactScanningConnectorInfo, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getArtefactScanningInfoSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/filescanning/info',
  tags: ['artefact-scanning'],
  description: 'Get the current user',
  schema: getArtefactScanningInfoSchema,
  responses: {
    200: {
      description: 'Details about the currently logged in user.',
      content: {
        'application/json': {
          schema: z.object({ scanners: artefactScanningConnectorInfo }),
        },
      },
    },
  },
})
interface GetArtefactScanningInfoResponse {
  scanners: ArtefactScanningConnectorInfo[]
}

export const getArtefactScanningInfo = [
  async (req: Request, res: Response<GetArtefactScanningInfoResponse>): Promise<void> => {
    const _ = parse(req, getArtefactScanningInfoSchema)
    res.json({ scanners: scanners.scannersInfo() })
  },
]
