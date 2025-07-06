import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import scanners from '../../../connectors/fileScanning/index.js'

interface GetFileScanningInfoResponse {
  scanners: string[]
}

export const getFilescanningInfo = [
  bodyParser.json(),
  async (req: Request, res: Response<GetFileScanningInfoResponse>): Promise<void> => {
    res.json({ scanners: scanners.info().scannerNames })
  },
]
