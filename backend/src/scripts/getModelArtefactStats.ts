import FileModel from '../models/File.js'
import ModelModel, { EntryKind } from '../models/Model.js'
import ReleaseModel from '../models/Release.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import { getHttpsUndiciAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

async function script() {
  // setup
  await connectToMongoose()

  const registry = config.registry.connection.internal
  const token = await getAccessToken({ dn: 'user' }, [{ type: 'registry', class: '', name: 'catalog', actions: ['*'] }])
  const authorisation = `Bearer ${token}`
  const agent = getHttpsUndiciAgent({
    connect: { rejectUnauthorized: !config.registry.connection.insecure },
  })

  // main functionality
  const modelsWithReleasesAndFiles = await ModelModel.aggregate([
    { $match: { kind: EntryKind.Model } },
    {
      $lookup: {
        from: 'v2_releases',
        localField: 'id',
        foreignField: 'modelId',
        as: 'releases',
      },
    },
    {
      $lookup: {
        from: 'v2_files',
        localField: 'releases.fileIds',
        foreignField: '_id',
        as: 'files',
      },
    },
    {
      $addFields: {
        releasesWithFilesCount: {
          $size: {
            $filter: {
              input: '$releases',
              as: 'release',
              cond: { $gt: [{ $size: '$$release.fileIds' }, 0] },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        modelsWithReleasesWithFiles: {
          $sum: { $cond: [{ $gt: ['$releasesWithFilesCount', 0] }, 1, 0] },
        },
        modelsWithReleasesNoFiles: {
          $sum: {
            $cond: [{ $and: [{ $gt: [{ $size: '$releases' }, 0] }, { $eq: ['$releasesWithFilesCount', 0] }] }, 1, 0],
          },
        },
        modelsWithNoReleases: {
          $sum: { $cond: [{ $eq: [{ $size: '$releases' }, 0] }, 1, 0] },
        },
      },
    },
  ])
  log.info('Found models with releases:', { ...(({ _id, ...all }) => all)(modelsWithReleasesAndFiles[0]) })

  const filesPerReleaseStats = await ReleaseModel.aggregate([
    { $match: { fileIds: { $exists: true, $ne: [] } } }, // Releases with Files
    {
      $lookup: {
        from: 'v2_files',
        localField: 'fileIds',
        foreignField: '_id',
        as: 'files',
      },
    },
    {
      $addFields: {
        fileCount: { $size: '$files' },
      },
    },
    {
      $group: {
        _id: null,
        filesPerRelease: { $push: '$fileCount' },
      },
    },
    {
      $project: {
        _id: 0,
        distribution: '$filesPerRelease',
      },
    },
  ])
  log.info('Found files per release:', { distribution: filesPerReleaseStats[0]?.distribution })

  const fileSizeDistribution = await FileModel.aggregate([
    {
      $match: {
        size: { $exists: true, $ne: null },
      },
    },
    {
      $bucket: {
        groupBy: '$size',
        boundaries: Array.from({ length: 7 }, (_, i) => 1024 ** i), // Boundaries in bytes
        default: 'Other',
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ])
  log.info('File size distribution:', fileSizeDistribution)

  const stats = await Promise.all(
    Object.entries({
      totalModels: ModelModel.countDocuments({ kind: EntryKind.Model }),
      totalReleases: ReleaseModel.countDocuments({}),
      totalFiles: FileModel.countDocuments({}),
      releasesWithFiles: ReleaseModel.aggregate([
        { $match: { fileIds: { $exists: true, $ne: [] } } },
        { $lookup: { from: 'v2_files', localField: 'fileIds', foreignField: '_id', as: 'files' } },
        {
          $group: {
            _id: null,
            totalFileSize: { $sum: { $sum: '$files.size' } },
            fileCount: { $sum: { $size: '$files' } },
          },
        },
      ]),
      fileSizesDistribution: FileModel.aggregate([
        {
          $group: {
            _id: null,
            minSize: { $min: '$size' },
            maxSize: { $max: '$size' },
            avgSize: { $avg: '$size' },
            totalSize: { $sum: '$size' },
          },
        },
      ]),
    }).map(async ([k, v]) => [k, await v]),
  ).then(Object.fromEntries)
  log.info('Summary stats:', stats)

  // Get the catalog of repositories
  const catalogResponse = await fetch(`${registry}/v2/_catalog`, {
    headers: {
      Authorization: authorisation,
    },
    dispatcher: agent,
  })
  const catalog = (await catalogResponse.json()) as any
  const repositories = catalog.repositories // Array of repository names

  const releasesWithImages = await ReleaseModel.aggregate([
    {
      $project: {
        _id: 1,
        images: { $size: '$images' },
      },
    },
    {
      $match: { images: { $gt: 0 } }, // Only releases with images
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    },
  ])
  log.info('Found models with releases:', {
    totalRepositories: repositories.length,
    releasesWithImagesCount: releasesWithImages.length,
  })

  const imagesPerReleaseStats = await ReleaseModel.aggregate([
    { $match: { images: { $exists: true, $ne: [] } } }, // Only releases with images
    {
      $addFields: {
        imageCount: { $size: '$images' },
      },
    },
    {
      $group: {
        _id: null,
        imageCounts: { $push: '$imageCount' },
      },
    },
    {
      $project: {
        _id: 0,
        distribution: '$imageCounts',
      },
    },
  ])
  log.info('Found images per release:', { distribution: imagesPerReleaseStats[0]?.distribution })

  const allImageSizes: any[] = []
  for (const repo of repositories) {
    const repositoryToken = await getAccessToken({ dn: 'user' }, [
      { type: 'repository', class: '', name: repo, actions: ['*'] },
    ])
    const repositoryAuthorisation = `Bearer ${repositoryToken}`

    const repoTagsResponse = await fetch(`${registry}/v2/${repo}/tags/list`, {
      headers: {
        Authorization: repositoryAuthorisation,
      },
      dispatcher: agent,
    })
    const repoTags = (await repoTagsResponse.json()) as any

    if (Array.isArray(repoTags.tags)) {
      for (const tag of repoTags.tags) {
        const imageManifestResponse = await fetch(`${registry}/v2/${repo}/manifests/${tag}`, {
          headers: {
            Authorization: repositoryAuthorisation,
          },
          dispatcher: agent,
        })
        const imageManifest = (await imageManifestResponse.json()) as any
        // Extract size from the manifest
        if (Array.isArray(imageManifest.layers)) {
          imageManifest.layers.forEach((layer) => allImageSizes.push(layer.size))
        }
      }
    }
  }
  log.info('Image size distribution:', allImageSizes)

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
