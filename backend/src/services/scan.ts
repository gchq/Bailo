import { ClientSession } from 'mongoose'

import { ArtefactScanResult, ArtefactScanState, LayerRefInterface } from '../connectors/artefactScanning/Base.js'
import scanners from '../connectors/artefactScanning/index.js'
import { FileAction, ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { FileInterface, FileInterfaceDoc, FileWithScanResultsInterface } from '../models/File.js'
import { ImageRef } from '../models/Release.js'
import ScanModel, { ArtefactKind, ArtefactKindKeys } from '../models/Scan.js'
import { UserInterface } from '../models/User.js'
import { issueAccessToken } from '../routes/v1/registryAuth.js'
import { dedupeByKey } from '../utils/array.js'
import config from '../utils/config.js'
import { BadReq, Conflict, Forbidden, NotFound } from '../utils/error.js'
import { plural } from '../utils/string.js'
import { useTransaction } from '../utils/transactions.js'
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

export async function updateArtefactScanWithResults(
  scanIdentifier: ArtefactScanIdentifier,
  results: ArtefactScanResult[],
  session?: ClientSession,
) {
  const bulkOps = results.map((result) => {
    // Only insert new (in progress) scans, otherwise only allow updating results
    // This prevents a race condition between multiple simultaneously triggered scans
    const isInProgress = result.state === ArtefactScanState.InProgress
    return {
      updateOne: {
        filter: {
          ...scanIdentifier,
          toolName: result.toolName,
          ...(isInProgress
            ? {
                $or: [
                  { state: { $ne: ArtefactScanState.InProgress } },
                  { lastRunAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } }, // age off old results (in case of crash or SIGKILL)
                ],
              }
            : {}),
        },
        update: { $set: { ...result } },
        upsert: isInProgress,
      },
    }
  })

  try {
    return await ScanModel.bulkWrite(bulkOps, { session, ordered: true })
  } catch (err: any) {
    if (err.code === 11000) {
      throw Conflict('Scan already in progress', { scanIdentifier })
    }
    throw err
  }
}

type RunScansParams = { file: FileInterface; layerRef?: never } | { file?: never; layerRef: LayerRefInterface }
/**
 * Only await if you want to wait for the scans to complete.
 */
async function runScans({ file, layerRef }: RunScansParams) {
  const requiredScannerType: ArtefactKindKeys = file ? 'file' : 'image'
  const scannersInfo = scanners.scannersInfo()
  const activeScanners = scannersInfo.filter((scannerInfo) => scannerInfo.artefactKind === requiredScannerType)
  if (activeScanners.length === 0) {
    throw NotFound(`No ${requiredScannerType} scanners are enabled.`)
  }
  let scanIdentifier: ArtefactScanIdentifier
  if (file) {
    scanIdentifier = {
      artefactKind: 'file',
      fileId: file.id,
    }
  } else if (layerRef) {
    scanIdentifier = {
      artefactKind: 'image',
      layerDigest: layerRef.layerDigest,
    }
  }

  await useTransaction([
    async (session) => {
      try {
        const resultsInprogress: ArtefactScanResult[] = activeScanners.map((scannerInfo) => ({
          ...scannerInfo,
          state: ArtefactScanState.InProgress,
          lastRunAt: new Date(),
        }))

        await updateArtefactScanWithResults(scanIdentifier, resultsInprogress, session)

        const resultsArray = await scanners.startScans({ ...(file ? { file } : { layerRef }) })
        await updateArtefactScanWithResults(scanIdentifier, resultsArray, session)
      } catch (error) {
        log.warn({ scannersInfo, scanIdentifier, error }, 'Unable to run scans. Attempting to set failure state.')
        const failedResults = activeScanners.map((scannerInfo) => ({
          ...scannerInfo,
          state: ArtefactScanState.Error,
          lastRunAt: new Date(),
        }))

        // This will always release the lock by setting results to no longer be in progress
        await updateArtefactScanWithResults(scanIdentifier, failedResults, session)
      }
    },
  ])
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
  const fileIdentifier = { artefactKind: ArtefactKind.FILE, fileId: file.id }
  runScans({ file })

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

  // Do not await so that the endpoint can return early (fire-and-forget)
  runScans({ file }).catch((error) => {
    log.error(
      { scanIdentifier: fileIdentifier, file, error },
      'Unable to set failure state after failing to run file scans. Safely aborted.',
    )
  })
  return `File scan started for ${file.name}`
}

export async function rerunImageScan(user: UserInterface, modelId: string, image: ImageRef) {
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

  const repositoryToken = await issueAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${image.repository}/${image.name}`, actions: ['pull'] },
  ])

  return await rerunImageScanNoAuth(image, repositoryToken)
}

/**
 * Rerun an image scan without doing any auth checks.
 *
 * @remarks
 * _Only_ use this function when an auth check would break expected functionality, otherwise use `rerunImageScan`.
 */
export async function rerunImageScanNoAuth(image: ImageRef, repositoryToken: string) {
  const imageLayers = dedupeByKey(await getImageLayers(repositoryToken, image), (d) => d.digest)
  const imageName = `${image.repository}/${image.name}${'tag' in image ? ':' + image.tag : '@' + image.digest}`

  // Only check timing for the config (which is effectively unique per manifest)
  // config is always the first item in `imageLayers`
  const configLayerIdentifier = { artefactKind: ArtefactKind.IMAGE, layerDigest: imageLayers[0].digest }
  const minutesBeforeRescanning = await artefactScanDelay(configLayerIdentifier)
  if (minutesBeforeRescanning > 0) {
    throw BadReq(`Please wait ${plural(minutesBeforeRescanning, 'minute')} before attempting a rescan ${imageName}`)
  }

  for (const imageLayer of imageLayers) {
    const layerIdentifier = { artefactKind: ArtefactKind.IMAGE, layerDigest: imageLayer.digest }
    // Do not await so that the endpoint can return early (fire-and-forget)
    runScans({ layerRef: { ...image, layerDigest: imageLayer.digest } }).catch((error) => {
      log.error(
        { scanIdentifier: layerIdentifier, image, imageName, error },
        'Unable to set failure state after failing to run image scans. Safely aborted.',
      )
    })
  }
  return `Image scan started for ${imageName}`
}
