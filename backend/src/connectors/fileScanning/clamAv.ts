import NodeClam from 'clamscan'
import { Readable } from 'stream'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc, ScanState } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector, FileScanResult } from './Base.js'

let av: NodeClam
export const clamAvToolName = 'Clam AV'

export class ClamAvFileScanningConnector extends BaseFileScanningConnector {
  constructor() {
    super()
  }

  info() {
    return [clamAvToolName]
  }

  async init() {
    try {
      av = await new NodeClam().init({ clamdscan: config.avScanning.clamdscan })
    } catch (error) {
      throw ConfigurationError('Could not scan file as Clam AV is not running.', {
        clamAvConfig: config.avScanning,
      })
    }
  }

  async scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    if (!av) {
      throw ConfigurationError(
        'Clam AV does not look like it is running. Check that it has been correctly initialised by calling the init function.',
        {
          clamAvConfig: config.avScanning,
        },
      )
    }
    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    try {
      const { isInfected, viruses } = await av.scanStream(s3Stream)
      log.info(
        { modelId: file.modelId, fileId: file._id, name: file.name, result: { isInfected, viruses } },
        'Scan complete.',
      )
      return [
        {
          toolName: clamAvToolName,
          state: ScanState.Complete,
          scannerVersion: await av.getVersion(),
          isInfected,
          viruses,
          lastRunAt: new Date(),
        },
      ]
    } catch (error) {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan errored.')
      return [
        {
          toolName: clamAvToolName,
          state: ScanState.Error,
          scannerVersion: await av.getVersion(),
          lastRunAt: new Date(),
        },
      ]
    }
  }
}
