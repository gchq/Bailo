import ScanModel from '../models/Scan.js'

export async function up() {
  const orphanedScans = await ScanModel.aggregate([
    { $project: { fileIdObject: { $toObjectId: '$fileId' } } },
    { $lookup: { from: 'v2_files', localField: 'fileIdObject', foreignField: '_id', as: 'fileDocument' } },
    { $match: { fileDocument: { $size: 0 } } },
  ])
  await ScanModel.deleteMany({ _id: { $in: orphanedScans.map((scan) => scan._id) } })
  await ScanModel.deleteMany({ state: { $eq: 'notScanned' } })
}

export async function down() {
  /* NOOP */
}
