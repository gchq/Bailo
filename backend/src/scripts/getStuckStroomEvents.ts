import StroomEvent from '../models/StroomEvent.js'
import log from '../services/log.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

// npm run script -- getStroomStuckEvents
// npm run script -- getStroomStuckEvents --reset
async function script() {
  const shouldReset = process.argv.includes('reset')

  // setup
  await connectToMongoose()

  // This mirrors the check in processBatch() in src/services/stroom.ts.
  const stuckQuery = { batchId: '', attempts: { $gt: 3 } }
  const stuckCount = await StroomEvent.countDocuments(stuckQuery)

  if (stuckCount > 0) {
    const earliest = await StroomEvent.findOne(stuckQuery).sort({ updatedAt: 1 }).select({ updatedAt: 1 }).lean()
    const latest = await StroomEvent.findOne(stuckQuery).sort({ updatedAt: -1 }).select({ updatedAt: 1 }).lean()

    log.info(
      { stuckCount, earliestLastAttempt: earliest?.updatedAt, latestLastAttempt: latest?.updatedAt },
      'Number of stuck STROOM events',
    )
  } else {
    log.info({ stuckCount }, 'Number of stuck STROOM events')
  }

  if (shouldReset) {
    const result = await StroomEvent.updateMany(stuckQuery, { attempts: 0 })
    log.info({ resetCount: result.modifiedCount }, 'Reset stuck STROOM event attempts to 0')
  }

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
