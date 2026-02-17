/**
 * Get the following statistics:
 *    Number of Models;
 *    Number of Models with any Releases, and number of Models with no Releases;
 *    Number of Releases with any Files, and number of Releases with no Files;
 *    For all Files, the mean, median, standard deviation, minimum, maximum, 5th percentile, 10th percentile, 25th percentile, 75th percentile, 90th percentile and 95th percentile of the `size` across all Files;
 *    For Releases with Files, the mean, median, standard deviation, minimum, maximum, 5th percentile, 10th percentile, 25th percentile, 75th percentile, 90th percentile and 95th percentile of the number of Files per Release;
 *    For Releases with Files, the mean, median, standard deviation, minimum, maximum, 5th percentile, 10th percentile, 25th percentile, 75th percentile, 90th percentile and 95th percentile of the total (summed) `size` of all Files in the Release;
 *    Number of Releases with any Images, and number of Releases with no Images;
 *    For all Images, the mean, median, standard deviation, minimum, maximum, 5th percentile, 10th percentile, 25th percentile, 75th percentile, 90th percentile and 95th percentile of the `size` across all Images;
 *    For Releases with Images, the mean, median, standard deviation, minimum, maximum, 5th percentile, 10th percentile, 25th percentile, 75th percentile, 90th percentile and 95th percentile of the number of Images per Release;
 *    For Releases with Images, the mean, median, standard deviation, minimum, maximum, 5th percentile, 10th percentile, 25th percentile, 75th percentile, 90th percentile and 95th percentile of the total (summed) `size` of all Images in the Release;
 */
import prettyBytes from 'pretty-bytes'

import FileModel from '../models/File.js'
import ModelModel, { EntryKind } from '../models/Model.js'
import ReleaseModel from '../models/Release.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import { getHttpsUndiciAgent } from '../services/http.js'
import log from '../services/log.js'
import { joinDistributionPackageName } from '../services/registry.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import { AcceptManifestMediaTypeHeaderValue } from '../utils/registryResponses.js'

function calculateAverages(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  return { mean, stdDev, variance }
}

function percentile(values: number[], p: number, average: boolean = true) {
  if (!values.length) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper || !average) {
    return sorted[lower]
  }
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower)
}

// npm run script -- getModelArtefactStats
async function script() {
  // setup
  await connectToMongoose()
  const registry = config.registry.connection.internal
  const token = await getAccessToken({ dn: 'user' }, [{ type: 'registry', name: 'catalog', actions: ['*'] }])
  const authorisation = `Bearer ${token}`
  const agent = getHttpsUndiciAgent({
    connect: { rejectUnauthorized: !config.registry.connection.insecure },
  })

  // main functionality

  // number of Models
  const numModels = await ModelModel.countDocuments({ kind: EntryKind.Model })
  const numMirroredModels = await ModelModel.countDocuments({ kind: EntryKind.MirroredModel })
  const totalModels = numModels + numMirroredModels
  // Models with any/no Releases
  const modelsWithReleases = await ReleaseModel.distinct('modelId')
  const numModelsWithReleases = modelsWithReleases.length
  const numModelsWithoutReleases = totalModels - numModelsWithReleases
  log.info('Model stats', { totalModels, numModelsWithReleases, numModelsWithoutReleases })
  // Releases with any/no Files
  const numReleasesWithFiles = await ReleaseModel.countDocuments({ fileIds: { $exists: true, $ne: [] } })
  const totalReleases = await ReleaseModel.countDocuments()
  const numReleasesWithoutFiles = totalReleases - numReleasesWithFiles
  log.info('File Release stats', { totalReleases, numReleasesWithFiles, numReleasesWithoutFiles })
  // File size statistics
  const fileSizes = await FileModel.find({}, { size: 1, _id: 0 }).lean()
  const fileSizesArray = fileSizes.map((f) => f.size || 0)
  if (fileSizesArray.length > 0) {
    const fileZ = calculateAverages(fileSizesArray)
    const fileStats = {
      min: prettyBytes(Math.min(...fileSizesArray)),
      max: prettyBytes(Math.max(...fileSizesArray)),
      p5: prettyBytes(percentile(fileSizesArray, 5)),
      p10: prettyBytes(percentile(fileSizesArray, 10)),
      p25: prettyBytes(percentile(fileSizesArray, 25)),
      p75: prettyBytes(percentile(fileSizesArray, 75)),
      p90: prettyBytes(percentile(fileSizesArray, 90)),
      p95: prettyBytes(percentile(fileSizesArray, 95)),
      mean: prettyBytes(fileZ.mean),
      median: prettyBytes(percentile(fileSizesArray, 50)),
      stdDev: prettyBytes(fileZ.stdDev),
      variance: `${prettyBytes(fileZ.variance)}^2`,
    }
    log.info('File size stats', fileStats)
  } else {
    log.warn('No File size data collected from mongodb')
  }
  // number of Files per Release (Releases with Files only)
  if (fileSizesArray.length > 0) {
    const releasesWithFileCounts = await ReleaseModel.aggregate([
      { $match: { fileIds: { $exists: true, $ne: [] } } },
      { $project: { fileCount: { $size: '$fileIds' } } },
    ])
    const fileCountsArray = releasesWithFileCounts.map((r) => r.fileCount)
    const fileCountZ = calculateAverages(fileCountsArray)
    const fileCountStats = {
      min: Math.min(...fileCountsArray),
      max: Math.max(...fileCountsArray),
      p5: percentile(fileCountsArray, 5),
      p10: percentile(fileCountsArray, 10),
      p25: percentile(fileCountsArray, 25),
      p75: percentile(fileCountsArray, 75),
      p90: percentile(fileCountsArray, 90),
      p95: percentile(fileCountsArray, 95),
      mean: fileCountZ.mean,
      median: percentile(fileCountsArray, 50),
      stdDev: fileCountZ.stdDev,
      variance: fileCountZ.variance,
    }
    log.info('Files per release stats', fileCountStats)
  }
  // total File size per Release
  if (fileSizesArray.length > 0) {
    const releaseFileSizesAgg = await ReleaseModel.aggregate([
      { $match: { fileIds: { $exists: true, $ne: [] } } },
      {
        $lookup: {
          from: 'v2_files',
          localField: 'fileIds',
          foreignField: '_id',
          as: 'files',
        },
      },
      {
        $project: {
          totalSize: { $sum: '$files.size' },
        },
      },
    ])
    const totalSizesArray = releaseFileSizesAgg.map((r) => r.totalSize || 0)
    const totalSizeZ = calculateAverages(totalSizesArray)
    const totalSizeStats = {
      min: prettyBytes(Math.min(...totalSizesArray)),
      max: prettyBytes(Math.max(...totalSizesArray)),
      p5: prettyBytes(percentile(totalSizesArray, 5)),
      p10: prettyBytes(percentile(totalSizesArray, 10)),
      p25: prettyBytes(percentile(totalSizesArray, 25)),
      p75: prettyBytes(percentile(totalSizesArray, 75)),
      p90: prettyBytes(percentile(totalSizesArray, 90)),
      p95: prettyBytes(percentile(totalSizesArray, 95)),
      mean: prettyBytes(totalSizeZ.mean),
      median: prettyBytes(percentile(totalSizesArray, 50)),
      stdDev: prettyBytes(totalSizeZ.stdDev),
      variance: `${prettyBytes(totalSizeZ.variance)}^2`,
    }
    log.info('Total file size per release stats', totalSizeStats)
  }

  // Releases with any/no Images
  const numReleasesWithImages = await ReleaseModel.countDocuments({
    images: { $exists: true, $ne: [] },
  })
  const numReleasesWithoutImages = totalReleases - numReleasesWithImages

  log.info('Image release stats', {
    totalReleases,
    numReleasesWithImages,
    numReleasesWithoutImages,
  })

  const releasesWithImages = await ReleaseModel.find(
    { images: { $exists: true, $ne: [] } },
    { _id: 1, images: 1 },
  ).lean()

  const imagesPerRelease: Record<string, number[]> = {}
  const releaseImageNames: Record<string, string[]> = {}

  for (const rel of releasesWithImages) {
    const releaseId = rel._id.toString()
    imagesPerRelease[releaseId] = []
    releaseImageNames[releaseId] = (rel.images || []).map((i) =>
      joinDistributionPackageName({ domain: i.repository, path: i.name, tag: i.tag }),
    )
  }

  // fetch all repository names from the registry
  const catalog = (await fetch(`${registry}/v2/_catalog`, {
    headers: { Authorization: authorisation },
    dispatcher: agent,
  }).then((res) => res.json())) as { repositories: string[] }

  const imageSizesArray: number[] = []

  // iterate over all repositories in the catalog
  await Promise.all(
    catalog.repositories.map(async (repositoryName) => {
      const repositoryToken = await getAccessToken({ dn: 'user' }, [
        { type: 'repository', name: repositoryName, actions: ['*'] },
      ])
      const repositoryAuthorisation = `Bearer ${repositoryToken}`

      const tagsList = (await fetch(`${registry}/v2/${repositoryName}/tags/list`, {
        headers: { Authorization: repositoryAuthorisation },
        dispatcher: agent,
      }).then((res) => res.json())) as { name: string; tags: string[] }

      if (!tagsList.tags) {
        return
      } // no tags = skip

      // 5️⃣ Process each tag
      await Promise.all(
        tagsList.tags.map(async (tag) => {
          // Pull manifest
          const manifest = (await fetch(`${registry}/v2/${repositoryName}/manifests/${tag}`, {
            headers: {
              Authorization: repositoryAuthorisation,
              Accept: AcceptManifestMediaTypeHeaderValue,
            },
            dispatcher: agent,
          }).then((res) => res.json())) as { layers?: { size: number }[] }

          if (!manifest.layers) {
            return
          }

          // Calculate total image size for this image (sum of layer sizes)
          const totalImageSize = manifest.layers.reduce((sum, layer) => sum + (layer.size || 0), 0)

          imageSizesArray.push(totalImageSize)

          // Match to releases by checking repository:tag or repository name
          const imageKeyWithTag = `${repositoryName}:${tag}`.toLowerCase()
          const imageKeyNoTag = repositoryName.toLowerCase()

          for (const [releaseId, imgNames] of Object.entries(releaseImageNames)) {
            if (imgNames.includes(imageKeyWithTag) || imgNames.includes(imageKeyNoTag)) {
              imagesPerRelease[releaseId].push(totalImageSize)
            }
          }
        }),
      )
    }),
  )

  // Image size statistics
  if (imageSizesArray.length > 0) {
    const imgZ = calculateAverages(imageSizesArray)
    const imageStats = {
      min: prettyBytes(Math.min(...imageSizesArray)),
      max: prettyBytes(Math.max(...imageSizesArray)),
      p5: prettyBytes(percentile(imageSizesArray, 5)),
      p10: prettyBytes(percentile(imageSizesArray, 10)),
      p25: prettyBytes(percentile(imageSizesArray, 25)),
      p75: prettyBytes(percentile(imageSizesArray, 75)),
      p90: prettyBytes(percentile(imageSizesArray, 90)),
      p95: prettyBytes(percentile(imageSizesArray, 95)),
      mean: prettyBytes(imgZ.mean),
      median: prettyBytes(percentile(imageSizesArray, 50, false)),
      stdDev: prettyBytes(imgZ.stdDev),
      variance: `${prettyBytes(imgZ.variance)}^2`,
    }
    log.info('Image size stats (all images)', imageStats)
  } else {
    log.warn('No image size data collected from registry')
  }
  // number of Images per Release (Releases with Images only)
  const imageCountsArray = Object.values(imagesPerRelease).map((imgs) => imgs.length)
  if (imageCountsArray.length > 0) {
    const imgCountZ = calculateAverages(imageCountsArray)
    const imageCountStats = {
      min: Math.min(...imageCountsArray),
      max: Math.max(...imageCountsArray),
      p5: percentile(imageCountsArray, 5),
      p10: percentile(imageCountsArray, 10),
      p25: percentile(imageCountsArray, 25),
      p75: percentile(imageCountsArray, 75),
      p90: percentile(imageCountsArray, 90),
      p95: percentile(imageCountsArray, 95),
      mean: imgCountZ.mean,
      median: percentile(imageCountsArray, 50, false),
      stdDev: imgCountZ.stdDev,
      variance: imgCountZ.variance,
    }
    log.info('Images per release stats', imageCountStats)
  }

  // total Image size per Release
  const totalImageSizesArray = Object.values(imagesPerRelease).map((imgs) => imgs.reduce((sum, s) => sum + s, 0))
  if (totalImageSizesArray.length > 0) {
    const totalImgSizeZ = calculateAverages(totalImageSizesArray)
    const totalImageSizeStats = {
      min: prettyBytes(Math.min(...totalImageSizesArray)),
      max: prettyBytes(Math.max(...totalImageSizesArray)),
      p5: prettyBytes(percentile(totalImageSizesArray, 5)),
      p10: prettyBytes(percentile(totalImageSizesArray, 10)),
      p25: prettyBytes(percentile(totalImageSizesArray, 25)),
      p75: prettyBytes(percentile(totalImageSizesArray, 75)),
      p90: prettyBytes(percentile(totalImageSizesArray, 90)),
      p95: prettyBytes(percentile(totalImageSizesArray, 95)),
      mean: prettyBytes(totalImgSizeZ.mean),
      median: prettyBytes(percentile(totalImageSizesArray, 50, false)),
      stdDev: prettyBytes(totalImgSizeZ.stdDev),
      variance: `${prettyBytes(totalImgSizeZ.variance)}^2`,
    }
    log.info('Total image size per release stats', totalImageSizeStats)
  }

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
