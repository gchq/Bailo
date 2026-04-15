import ScanModel from '../models/Scan.js'
import log from '../services/log.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

const STATE_PRIORITY: Record<string, number> = {
  complete: 0,
  error: 1,
  inProgress: 2,
  notScanned: 3,
}

async function script() {
  await connectToMongoose()

  const duplicates = await ScanModel.aggregate([
    { $match: { artefactKind: 'image', layerDigest: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: { layerDigest: '$layerDigest', toolName: '$toolName' },
        ids: { $push: '$_id' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ])

  for (const dup of duplicates) {
    const scans = await ScanModel.find({ _id: { $in: dup.ids } })

    scans.sort((a, b) => {
      const pA = STATE_PRIORITY[a.state] ?? 99
      const pB = STATE_PRIORITY[b.state] ?? 99
      if (pA !== pB) {
        return pA - pB
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    const keep = scans[0]
    const remove = scans.slice(1).map((s) => s._id)

    if (remove.length > 0) {
      await ScanModel.deleteMany({ _id: { $in: remove } })
      log.debug(`layerDigest=${dup._id.layerDigest} tool=${dup._id.toolName} kept=${keep._id} removed=${remove.length}`)
    }
  }

  setTimeout(disconnectFromMongoose, 50)
}

script()
