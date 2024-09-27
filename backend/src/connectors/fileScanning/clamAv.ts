import NodeClam from 'clamscan'
import { Readable } from 'stream'

import { getObjectStream } from '../../clients/s3.js'
import FileModel, { FileInterfaceDoc, ScanState } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { BaseFileScanningConnector, FileScanResult } from './Base.js'

let av: NodeClam

export class ClamAvFileScanningConnector extends BaseFileScanningConnector {
  constructor() {
    super()
  }

  async init() {
    if (!av) {
      try {
        av = await new NodeClam().init({ clamdscan: config.avScanning.clamdscan })
      } catch (error) {
        log.error(error, 'Unable to connect to ClamAV.')
      }
    }
  }

  async scan(file: FileInterfaceDoc) {
    const avStream = av.passthrough()
    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    s3Stream.pipe(avStream)
    log.info({ modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan started.')
    const updatedAvScanArray = [...file.avScan, { toolName: 'Clam AV', state: ScanState.InProgress }]
    await file.update({ $set: { avScan: updatedAvScanArray } })
    avStream.on('scan-complete', async (result) => {
      log.info({ result, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan complete.')
      const newResult: FileScanResult = {
        toolName: 'Clam AV',
        state: ScanState.Complete,
        isInfected: result.isInfected,
        viruses: result.viruses,
      }
      await FileModel.updateOne(
        { _id: file._id, 'avScan.toolName': 'Clam AV' },
        {
          $set: { 'avScan.$': newResult },
        },
      )
    })
    avStream.on('error', async (error) => {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan errored.')
      const newResult: FileScanResult = {
        toolName: 'Clam AV',
        state: ScanState.Error,
      }
      await FileModel.updateOne(
        { _id: file._id, 'avScan.toolName': 'Clam AV' },
        {
          $set: { 'avScan.$': newResult },
        },
      )
    })
    avStream.on('timeout', async (error) => {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan timed out.')
      const newResult: FileScanResult = {
        toolName: 'Clam AV',
        state: ScanState.Error,
      }
      await FileModel.updateOne(
        { _id: file._id, 'avScan.toolName': 'Clam AV' },
        {
          $set: { 'avScan.$': newResult },
        },
      )
    })
  }
}
