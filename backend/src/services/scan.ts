import {
  ArtefactInterface,
  ArtefactScanningConnectorInfo,
  ArtefactScanResult,
  ArtefactScanState,
} from '../connectors/artefactScanning/Base.js'
import scanners from '../connectors/artefactScanning/index.js'
import { FileAction, ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { FileInterfaceDoc, FileWithScanResultsInterface } from '../models/File.js'
import { ImageRefInterface } from '../models/Release.js'
import ScanModel, { ArtefactKind } from '../models/Scan.js'
import { UserInterface } from '../models/User.js'
import { toBailoError } from '../types/error.js'
import { dedupe } from '../utils/array.js'
import config from '../utils/config.js'
import { BadReq, Forbidden } from '../utils/error.js'
import { plural } from '../utils/string.js'
import { getFileById } from './file.js'
import { getImageLayers } from './images/getImageLayers.js'
import log from './log.js'
import { getModelById } from './model.js'

type ArtefactScanIdentifier =
  | {
      artefactKind: typeof ArtefactKind.FILE
      fileId: string
    }
  | {
      artefactKind: typeof ArtefactKind.IMAGE
      layerDigest: string
    }

async function updateArtefactScanWithResults(
  scanIdentifier: ArtefactScanIdentifier,
  results: ArtefactScanResult[],
  imageName?: string, // Expected to be of format `${image.repository}/${image.name}:${image.tag}`
) {
  for (const result of results) {
    const update: any = {
      $set: { ...result },
    }

    if (scanIdentifier.artefactKind === ArtefactKind.IMAGE && imageName) {
      update.$addToSet = {
        imagesContainingLayer: imageName,
      }
    }

    const updateExistingResult = await ScanModel.updateOne({ ...scanIdentifier, toolName: result.toolName }, update)
    if (updateExistingResult.modifiedCount === 0) {
      await ScanModel.create({
        ...scanIdentifier,
        ...result,
        ...(scanIdentifier.artefactKind === ArtefactKind.IMAGE && imageName
          ? { imagesContainingLayer: [imageName] }
          : {}),
      })
    }
  }
}

async function runScans(
  scannersInfo: ArtefactScanningConnectorInfo[],
  scanIdentifier: ArtefactScanIdentifier,
  artefact: ArtefactInterface,
  imageName?: string, // Expected to be of format `${image.repository}/${image.name}:${image.tag}`
) {
  if (scannersInfo && scannersInfo.length > 0) {
    try {
      const resultsInprogress = scannersInfo.reduce((res, scannerInfo) => {
        if (scannerInfo.artefactKind === scanIdentifier.artefactKind) {
          res.push({
            ...scannerInfo,
            state: ArtefactScanState.InProgress,
            lastRunAt: new Date(),
          })
        }
        return res
      }, [] as ArtefactScanResult[])

      await updateArtefactScanWithResults(scanIdentifier, resultsInprogress, imageName)

      const resultsArray = await scanners.startScans(artefact)
      await updateArtefactScanWithResults(scanIdentifier, resultsArray, imageName)
    } catch (error) {
      try {
        log.warn(
          { scannersInfo, scanIdentifier, imageName, error },
          'Unable to run scans. Attempting to set failure state.',
        )
        const failedResults = scannersInfo.reduce((res, scannerInfo) => {
          if (scannerInfo.artefactKind === scanIdentifier.artefactKind) {
            res.push({
              ...scannerInfo,
              state: ArtefactScanState.Error,
              lastRunAt: new Date(),
            })
          }
          return res
        }, [] as ArtefactScanResult[])

        await updateArtefactScanWithResults(scanIdentifier, failedResults, imageName)
      } catch (nestedError) {
        throw toBailoError(nestedError, { scannersInfo, scanIdentifier, imageName, previousError: error })
      }
    }
  }
}

async function artefactScanDelay(scanIdentifier: ArtefactScanIdentifier): Promise<number> {
  const delay = config.connectors.artefactScanners.retryDelayInMinutes
  if (delay === undefined) {
    return 0
  }
  let minutesBeforeRetrying = 0

  const artefactScans = await ScanModel.find(scanIdentifier)
  for (const scanResults of artefactScans) {
    const delayInMilliseconds = delay * 60000
    const scanTimeAtLimit = scanResults.lastRunAt.getTime() + delayInMilliseconds
    if (scanTimeAtLimit > new Date().getTime()) {
      minutesBeforeRetrying = scanTimeAtLimit - new Date().getTime()
      break
    }
  }
  return Math.round(minutesBeforeRetrying / 60000)
}

export async function scanFile(file: FileInterfaceDoc) {
  const scannersInfo = scanners.scannersInfo()
  const fileIdentifier = { artefactKind: ArtefactKind.FILE, fileId: file.id }
  await runScans(scannersInfo, fileIdentifier, file)

  const scanResults = await ScanModel.find(fileIdentifier)
  const ret: FileWithScanResultsInterface = {
    ...file.toObject(),
    scanResults,
    id: file._id.toString(),
  }

  return ret
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

  const fileIdentifier = { artefactKind: ArtefactKind.FILE, fileId: file.id }
  const minutesBeforeRescanning = await artefactScanDelay(fileIdentifier)
  if (minutesBeforeRescanning > 0) {
    throw BadReq(`Please wait ${plural(minutesBeforeRescanning, 'minute')} before attempting a rescan ${file.name}`)
  }

  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  const scannersInfo = scanners.scannersInfo()

  // Do not await so that the endpoint can return early (fire-and-forget)
  void runScans(scannersInfo, fileIdentifier, file).catch((error) => {
    log.error(
      { scannersInfo, scanIdentifier: fileIdentifier, file, error },
      'Unable to set failure state after failing to run file scans. Safely aborted.',
    )
  })
  return `File scan started for ${file.name}`
}

export async function rerunImageScan(user: UserInterface, modelId: string, image: ImageRefInterface) {
  const model = await getModelById(user, modelId)
  if (!model) {
    throw BadReq('Cannot find requested model', { modelId: modelId })
  }
  const rerunArtefactScanAuth = await authorisation.image(user, model, {
    type: 'repository',
    name: model.id,
    actions: ['pull'],
  })
  if (!rerunArtefactScanAuth.success) {
    throw Forbidden(rerunArtefactScanAuth.info, { userDn: user.dn, modelId, image })
  }

  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  const scannersInfo = scanners.scannersInfo()
  const imageLayers = dedupe(await getImageLayers(user, image))
  const imageName = `${image.repository}/${image.name}:${image.tag}`
  log.debug({ scannersInfo, imageLayers })
  for (const imageLayer of imageLayers) {
    const layerIdentifier = { artefactKind: ArtefactKind.IMAGE, layerDigest: imageLayer.digest }
    const minutesBeforeRescanning = await artefactScanDelay(layerIdentifier)
    if (minutesBeforeRescanning > 0) {
      throw BadReq(`Please wait ${plural(minutesBeforeRescanning, 'minute')} before attempting a rescan ${imageName}`)
    }

    // Do not await so that the endpoint can return early (fire-and-forget)
    runScans(scannersInfo, layerIdentifier, { ...image, layerDigest: imageLayer.digest }, imageName).catch((error) => {
      log.error(
        { scannersInfo, scanIdentifier: layerIdentifier, image, imageName, error },
        'Unable to set failure state after failing to run image scans. Safely aborted.',
      )
    })
  }
  return `Image scan started for ${imageName}`
}
