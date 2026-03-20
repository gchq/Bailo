import { getImageTagManfiestList, isImageTagManifestList } from '../clients/registry.js'
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
import ScanModel, { ArtefactKind, ArtefactKindKeys } from '../models/Scan.js'
import { UserInterface } from '../models/User.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import { toBailoError } from '../types/error.js'
import { dedupe } from '../utils/array.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, NotFound } from '../utils/error.js'
import { Descriptors } from '../utils/registryResponses.js'
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

async function updateArtefactScanWithResults(scanIdentifier: ArtefactScanIdentifier, results: ArtefactScanResult[]) {
  for (const result of results) {
    await ScanModel.updateOne(
      { ...scanIdentifier, toolName: result.toolName },
      { $set: { ...result } },
      { upsert: true },
    )
  }
}

async function runScans(
  scannersInfo: ArtefactScanningConnectorInfo[],
  scanIdentifier: ArtefactScanIdentifier,
  artefact: ArtefactInterface,
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

      await updateArtefactScanWithResults(scanIdentifier, resultsInprogress)

      const resultsArray = await scanners.startScans(artefact)
      await updateArtefactScanWithResults(scanIdentifier, resultsArray)
    } catch (error) {
      try {
        log.warn({ scannersInfo, scanIdentifier, error }, 'Unable to run scans. Attempting to set failure state.')
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

        await updateArtefactScanWithResults(scanIdentifier, failedResults)
      } catch (nestedError) {
        throw toBailoError(nestedError, { scannersInfo, scanIdentifier, previousError: error })
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
  throwIfNoScanners(scannersInfo, ArtefactKind.FILE)

  // Do not await so that the endpoint can return early (fire-and-forget)
  runScans(scannersInfo, fileIdentifier, file).catch((error) => {
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
  throwIfNoScanners(scannersInfo, ArtefactKind.IMAGE)

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${image.repository}/${image.name}`, actions: ['pull'] },
  ])
  let imageLayers: Descriptors[]
  if (await isImageTagManifestList(repositoryToken, image)) {
    const imageArchitectures = await getImageTagManfiestList(repositoryToken, image)
    const layerResults = await Promise.all(
      imageArchitectures.map((architecture) =>
        getImageLayers(repositoryToken, {
          repository: image.repository,
          name: image.name,
          tag: architecture.digest,
        }),
      ),
    )
    imageLayers = dedupe(layerResults.flat())
  } else {
    imageLayers = dedupe(await getImageLayers(repositoryToken, image))
  }
  const imageName = `${image.repository}/${image.name}:${image.tag}`

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
    runScans(scannersInfo, layerIdentifier, { ...image, layerDigest: imageLayer.digest }).catch((error) => {
      log.error(
        { scannersInfo, scanIdentifier: layerIdentifier, image, imageName, error },
        'Unable to set failure state after failing to run image scans. Safely aborted.',
      )
    })
  }
  return `Image scan started for ${imageName}`
}

function throwIfNoScanners(scannersInfo: ArtefactScanningConnectorInfo[], artefactKind: ArtefactKindKeys) {
  if (!scannersInfo.some((scannerInfo) => scannerInfo.artefactKind === artefactKind)) {
    throw NotFound(`No ${artefactKind} scanners are enabled.`)
  }
}
