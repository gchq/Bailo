import FileModel from '../models/File.js'
import ModelModel, { EntryKind } from '../models/Model.js'
import ReleaseModel from '../models/Release.js'
import log from '../services/log.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

async function script() {
  // setup
  await connectToMongoose()

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
  log.info('Found files per release:', { distribution: filesPerReleaseStats[0].distribution })

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

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
