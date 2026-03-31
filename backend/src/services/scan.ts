import mongoose, { ClientSession } from 'mongoose'

import { isImageTagManifestList } from '../clients/registry.js'
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
import { ImageRef } from '../models/Release.js'
import ScanModel, { ArtefactKind, ArtefactKindKeys } from '../models/Scan.js'
import { UserInterface } from '../models/User.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import { dedupe } from '../utils/array.js'
import config from '../utils/config.js'
import { BadReq, Conflict, Forbidden, InternalError, NotFound } from '../utils/error.js'
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

async function runScans(
  scannersInfo: ArtefactScanningConnectorInfo[],
  scanIdentifier: ArtefactScanIdentifier,
  artefact: ArtefactInterface,
  session?: ClientSession,
  newSession: boolean = false,
) {
  if (newSession && session) {
    throw InternalError('Cannot use an existing session with a new session', { scannersInfo, scanIdentifier })
  }
  let ownedSession: ClientSession | undefined

  try {
    if (newSession) {
      // Create a new session (useful for fire-and-forget approach)
      ownedSession = await mongoose.startSession()
      session = ownedSession
      session.startTransaction()
    }

    if (scannersInfo && scannersInfo.length > 0) {
      const activeScanners = scannersInfo.filter((s) => s.artefactKind === scanIdentifier.artefactKind)

      try {
        const resultsInprogress: ArtefactScanResult[] = activeScanners.map((scannerInfo) => ({
          ...scannerInfo,
          state: ArtefactScanState.InProgress,
          lastRunAt: new Date(),
        }))

        await updateArtefactScanWithResults(scanIdentifier, resultsInprogress, session)

        const resultsArray = await scanners.startScans(artefact)
        // This will always release the lock by setting results to no longer be in progress
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
    }

    if (ownedSession) {
      await ownedSession.commitTransaction()
    }
  } catch (err) {
    if (ownedSession) {
      // Only abort if we own the transaction
      await ownedSession.abortTransaction()
    }
    throw err
  } finally {
    if (ownedSession) {
      // Only clean up if we own the transaction
      ownedSession.endSession()
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

export async function scanFile(file: FileInterfaceDoc, session?: ClientSession) {
  const scannersInfo = scanners.scannersInfo()
  const fileIdentifier = { artefactKind: ArtefactKind.FILE, fileId: file.id }
  await runScans(scannersInfo, fileIdentifier, file, session)

  const scanResults = await ScanModel.find(fileIdentifier)
  const ret: FileWithScanResultsInterface = {
    ...file.toObject(),
    scanResults,
    id: file._id.toString(),
  }

  return ret
}

export async function rerunFileScan(user: UserInterface, modelId: string, fileId: string, newSession: boolean = false) {
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
  throwIfNoScanners(scannersInfo, ArtefactKind.FILE)

  // Do not await so that the endpoint can return early (fire-and-forget)
  runScans(scannersInfo, fileIdentifier, file, undefined, newSession).catch((error) => {
    log.error(
      { scannersInfo, scanIdentifier: fileIdentifier, file, error },
      'Unable to set failure state after failing to run file scans. Safely aborted.',
    )
  })
  return `File scan started for ${file.name}`
}

export async function rerunImageScan(
  user: UserInterface,
  modelId: string,
  image: ImageRef,
  newSession: boolean = false,
) {
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

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${image.repository}/${image.name}`, actions: ['pull'] },
  ])

  return await rerunImageScanNoAuth(image, repositoryToken, newSession)
}

/**
 * Rerun an image scan without doing any auth checks.
 *
 * @remarks
 * _Only_ use this function when an auth check would break expected functionality, otherwise use `rerunImageScan`.
 */
export async function rerunImageScanNoAuth(image: ImageRef, repositoryToken: string, newSession: boolean = false) {
  const scannersInfo = scanners.scannersInfo()
  throwIfNoScanners(scannersInfo, ArtefactKind.IMAGE)

  if (await isImageTagManifestList(repositoryToken, image)) {
    // TODO: add support for manifest lists/fat manifests
    throw InternalError('Bailo backend does not currently support scanning images with manifest lists.', { image })
  }
  const imageLayers = dedupe(await getImageLayers(repositoryToken, image))
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
    runScans(scannersInfo, layerIdentifier, { ...image, layerDigest: imageLayer.digest }, undefined, newSession).catch(
      (error) => {
        log.error(
          { scannersInfo, scanIdentifier: layerIdentifier, image, imageName, error },
          'Unable to set failure state after failing to run image scans. Safely aborted.',
        )
      },
    )
  }
  return `Image scan started for ${imageName}`
}

function throwIfNoScanners(scannersInfo: ArtefactScanningConnectorInfo[], artefactKind: ArtefactKindKeys) {
  if (!scannersInfo.some((scannerInfo) => scannerInfo.artefactKind === artefactKind)) {
    throw NotFound(`No ${artefactKind} scanners are enabled.`)
  }
}
