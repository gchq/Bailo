import NodeClam from 'clamscan'
import { Readable } from 'stream'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { BaseFileScanningConnector, FileScanResult, ScanState } from './Base.js'

export class ClamAvFileScanningConnector extends BaseFileScanningConnector {
  toolName = 'Clam AV'
  version: string | undefined = undefined
  av: NodeClam | undefined = undefined

  constructor() {
    super()
  }

  async init() {
    this.av = await new NodeClam().init({ clamdscan: config.avScanning.clamdscan })
    const scannerVersion = await this.av.getVersion()
    this.version = scannerVersion.substring(scannerVersion.indexOf(' ') + 1, scannerVersion.indexOf('/'))
    return this
  }

  getScannerVersion() {
    return this.version
  }

  async scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    if (!this.av) {
      return await this.scanError(`Could not use ${this.toolName} as it is not been correctly initialised.`)
    }
    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    try {
      const { isInfected, viruses } = await this.av.scanStream(s3Stream)
      log.info(
        { modelId: file.modelId, fileId: file._id.toString(), name: file.name, result: { isInfected, viruses } },
        'Scan complete.',
      )
      return [
        {
          ...(await this.info()),
          state: ScanState.Complete,
          isInfected,
          viruses,
          lastRunAt: new Date(),
        },
      ]
    } catch (error) {
      return this.scanError(`Unable to scan file. ${this.toolName} errored.`, { error, file })
    }
  }
}
