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
    await this.init()
    if (!av) {
      throw ConfigurationError(
        'Clam AV does not look like it is running. Chec that it has been correctly initialised by calling the init function.',
        {
          clamAvConfig: config.avScanning,
        },
      )
    }
    const avStream = av.passthrough()
    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    s3Stream.pipe(avStream)
    log.info({ modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan started.')
    const res: FileScanResult = await new Promise((resolve) => {
      avStream
        .on('scan-complete', (result) => {
          log.info({ modelId: file.modelId, fileId: file._id, name: file.name, result }, 'Scan complete.')
          resolve({
            toolName: clamAvToolName,
            state: ScanState.Complete,
            isInfected: result.isInfected,
            viruses: result.viruses,
          })
        })
        .on('error', (err) => {
          log.error({ err, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan errored.')
          resolve({
            toolName: clamAvToolName,
            state: ScanState.Error,
          })
        })
      avStream.on('timeout', async (error) => {
        log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan timed out.')
        resolve({
          toolName: clamAvToolName,
          state: ScanState.Error,
        })
      })
    })
    return [res]
  }
}
