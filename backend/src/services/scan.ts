import { Schema } from 'mongoose'

import { ArtefactScanResult, ArtefactScanState } from '../connectors/artefactScanning/Base.js'
import scanners from '../connectors/artefactScanning/index.js'
import { FileAction, ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { FileInterface, FileInterfaceDoc, FileWithScanResultsInterface } from '../models/File.js'
import ScanModel, { ArtefactKind } from '../models/Scan.js'
import { UserInterface } from '../models/User.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../utils/error.js'
import { plural } from '../utils/string.js'
import { getFileById } from './file.js'
import { getModelById } from './model.js'

//This file is purposely incomplete as further image scanning work is prequisite. It does not contain enough logic towards handling the scanning of images

export async function scanFile(file: FileInterfaceDoc) {
  const scannersInfo = scanners.scannersInfo()
  if (scannersInfo && scannersInfo.scannerNames.length > 0 && file.size > 0) {
    const resultsInprogress: ArtefactScanResult[] = scannersInfo.scannerNames.map((scannerName) => ({
      toolName: scannerName,
      state: ArtefactScanState.InProgress,
      lastRunAt: new Date(),
    }))
    await updateFileWithResults(file._id, resultsInprogress)
    const resultsArray = await scanners.startScans(file)
    await updateFileWithResults(file._id, resultsArray)
  }

  const scanResults = await ScanModel.find({ fileId: file._id.toString() })
  const ret: FileWithScanResultsInterface = {
    ...file.toObject(),
    scanResults,
    id: file._id.toString(),
  }

  return ret
}

async function updateFileWithResults(_id: Schema.Types.ObjectId, results: ArtefactScanResult[] | undefined) {
  if (results === undefined) {
    throw InternalError(`No results provided`)
  }
  for (const result of results) {
    const updateExistingResult = await ScanModel.updateOne(
      { fileId: _id.toString(), toolName: result.toolName },
      {
        $set: { ...result },
      },
    )
    if (updateExistingResult.modifiedCount === 0) {
      await ScanModel.create({
        artefactKind: ArtefactKind.File,
        fileId: _id.toString(),
        ...result,
      })
    }
  }
}

async function fileScanDelay(file: FileInterface): Promise<number> {
  const delay = config.connectors.artefactScanners.retryDelayInMinutes
  if (delay === undefined) {
    return 0
  }
  let minutesBeforeRetrying = 0
  const fileScans = await ScanModel.find({ fileId: (file as FileInterface)._id.toString() })
  for (const scanResults of fileScans) {
    const delayInMilliseconds = delay * 60000
    const scanTimeAtLimit = scanResults.lastRunAt.getTime() + delayInMilliseconds
    if (scanTimeAtLimit > new Date().getTime()) {
      minutesBeforeRetrying = scanTimeAtLimit - new Date().getTime()
      break
    }
  }
  return Math.round(minutesBeforeRetrying / 60000)
}

export async function rerunFileScan(user: UserInterface, modelId: string, fileId: string) {
  const model = await getModelById(user, modelId)
  if (!model) {
    throw BadReq('Cannot find requested model', { modelId: modelId })
  }
  const file = await getFileById(user, fileId)
  if (!file) {
    throw BadReq('Cannot find requested file', { modelId: modelId, artefactId: fileId })
  }
  const rerunArtefactScanAuth = await authorisation.file(user, model, file, FileAction.Update)
  if (!rerunArtefactScanAuth.success) {
    throw Forbidden(rerunArtefactScanAuth.info, { userDn: user.dn, modelId, file })
  }
  if (!file.size || file.size === 0) {
    throw BadReq('Cannot run scan on an empty file')
  }
  const minutesBeforeRescanning = await fileScanDelay(file)
  if (minutesBeforeRescanning > 0) {
    throw BadReq(`Please wait ${plural(minutesBeforeRescanning, 'minute')} before attempting a rescan ${file.name}`)
  }
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }
  const scannersInfo = scanners.scannersInfo()
  if (scannersInfo && scannersInfo.scannerNames) {
    const resultsInprogress = scannersInfo.scannerNames.map((scannerName) => ({
      toolName: scannerName,
      state: ArtefactScanState.InProgress,
      lastRunAt: new Date(),
    }))
    await updateFileWithResults(file._id, resultsInprogress)

    const resultsArray = await scanners.startScans(file)
    await updateFileWithResults(file._id, resultsArray)
  }
  return `Scan started for ${file.name}`
}
