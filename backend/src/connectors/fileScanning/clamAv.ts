import NodeClam from 'clamscan'
import { Readable } from 'stream'

import { getObjectStream } from '../../clients/s3.js'
import FileModel, { FileInterfaceDoc, ScanState } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector, FileScanResult } from './Base.js'

let av: NodeClam
const toolName = 'Clam AV'

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
    if (!file.avScan.find((result) => result.toolName === toolName)) {
      const updatedAvScanArray = [...file.avScan, { toolName: toolName, state: ScanState.InProgress }]
      file.avScan = updatedAvScanArray
      await FileModel.updateOne(
        { _id: file._id },
        {
          $set: { avScan: updatedAvScanArray },
        },
      )
    }
    avStream.on('scan-complete', async (result) => {
      log.info({ result, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan complete.')
      const newResult: FileScanResult = {
        toolName: toolName,
        state: ScanState.Complete,
        isInfected: result.isInfected,
        viruses: result.viruses,
      }
      await FileModel.updateOne(
        { _id: file._id, 'avScan.toolName': toolName },
        {
          $set: { 'avScan.$': newResult },
        },
      )
    })
    avStream.on('error', async (error) => {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan errored.')
      const newResult: FileScanResult = {
        toolName: toolName,
        state: ScanState.Error,
      }
      await FileModel.updateOne(
        { _id: file._id, 'avScan.toolName': toolName },
        {
          $set: { 'avScan.$': newResult },
        },
      )
    })
    avStream.on('timeout', async (error) => {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan timed out.')
      const newResult: FileScanResult = {
        toolName: toolName,
        state: ScanState.Error,
      }
      await FileModel.updateOne(
        { _id: file._id, 'avScan.toolName': toolName },
        {
          $set: { 'avScan.$': newResult },
        },
      )
    })
  }
}
