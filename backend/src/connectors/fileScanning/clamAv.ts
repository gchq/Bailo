import NodeClam from 'clamscan'
import { Readable } from 'stream'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc, ScanState } from '../../models/File.js'
import { updateFileWithResults } from '../../services/file.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector } from './Base.js'

let av: NodeClam
export const clamAvToolName = 'Clam AV'

export class ClamAvFileScanningConnector extends BaseFileScanningConnector {
  constructor() {
    super()
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

  async scan(file: FileInterfaceDoc) {
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
    avStream.on('scan-complete', async (result) => {
      log.info({ result, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan complete.')
      updateFileWithResults(
        file,
        {
          toolName: clamAvToolName,
          state: ScanState.Complete,
          isInfected: result.isInfected,
          viruses: result.viruses,
        },
        clamAvToolName,
      )
    })
    avStream.on('error', async (error) => {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan errored.')
      updateFileWithResults(
        file,
        {
          toolName: clamAvToolName,
          state: ScanState.Error,
        },
        clamAvToolName,
      )
    })
    avStream.on('timeout', async (error) => {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan timed out.')
      updateFileWithResults(
        file,
        {
          toolName: clamAvToolName,
          state: ScanState.Error,
        },
        clamAvToolName,
      )
    })
  }
}
