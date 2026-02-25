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
  description:
    'Retrieve metadata about the configured artefact scanning connectors, including supported artefact kinds and scanner versions.',
  schema: getArtefactScanningInfoSchema,
  responses: {
    200: {
      description: 'A list of available artefact scanning connectors and their capabilities.',
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
