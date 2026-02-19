import { Request, Response } from 'express'

import scanners from '../../../connectors/artefactScanning/index.js'

interface GetArtefactScanningInfoResponse {
  scanners: string[]
}

export const getArtefactScanningInfo = [
  async (req: Request, res: Response<GetArtefactScanningInfoResponse>): Promise<void> => {
    res.json({ scanners: scanners.scannersInfo().scannerNames })
  },
]
