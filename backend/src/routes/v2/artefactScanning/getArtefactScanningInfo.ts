import { Request, Response } from 'express'

import { ArtefactScanningConnectorInfo } from '../../../connectors/artefactScanning/Base.js'
import scanners from '../../../connectors/artefactScanning/index.js'

interface GetArtefactScanningInfoResponse {
  scanners: ArtefactScanningConnectorInfo[]
}

export const getArtefactScanningInfo = [
  async (req: Request, res: Response<GetArtefactScanningInfoResponse>): Promise<void> => {
    res.json({ scanners: scanners.scannersInfo() })
  },
]
