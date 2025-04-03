import NodeClam from 'clamscan'
import { Readable } from 'stream'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector, FileScanResult, ScanState } from './Base.js'

let av: NodeClam

export class ClamAvFileScanningConnector extends BaseFileScanningConnector {
  constructor() {
    super()
  }

  async info() {
    return { toolName: 'Clam AV', scannerVersion: await this.getScannerVersion() }
  }

  async init(retryCount: number = 1) {
    log.info('Initialising Clam AV...')
    if (retryCount <= config.connectors.fileScanners.maxInitRetries) {
      setTimeout(async () => {
        try {
          av = await new NodeClam().init({ clamdscan: config.avScanning.clamdscan })
          log.info('Clam AV initialised.')
        } catch (_error) {
          log.warn(`Could not initialise Clam AV, retrying (attempt ${retryCount})...`)
          this.init(++retryCount)
        }
      }, config.connectors.fileScanners.initRetryDelay)
    } else {
      throw ConfigurationError(
        `Could not initialise Clam AV after ${retryCount} attempts, make sure that it is setup and configured correctly.`,
        {
          modelScanConfig: config.avScanning.modelscan,
        },
      )
    }
  }

  async getScannerVersion() {
    if (!av) return
    const scannerVersion = await av.getVersion()
    const modifiedVersion = scannerVersion.substring(scannerVersion.indexOf(' ') + 1, scannerVersion.indexOf('/'))
    return modifiedVersion
  }

  async scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    if (!av) {
      return await this.scanError(
        undefined,
        undefined,
        `Could not use ${(await this.info()).toolName} as it is not running`,
      )
    }
    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    try {
      const { isInfected, viruses } = await av.scanStream(s3Stream)
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
      return this.scanError(error, file)
    }
  }
}
