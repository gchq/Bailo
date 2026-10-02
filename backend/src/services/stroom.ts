import { Types } from 'mongoose'
import { create } from 'xmlbuilder2'

import { sendEvents } from '../clients/stroom.js'
import StroomEvent, { StroomEventLean, StroomEventObject } from '../models/StroomEvent.js'
import config from '../utils/config.js'
import { longId } from '../utils/id.js'
import log from './log.js'

const MAX_ATTEMPTS = 3

let inFlightBatch = false

export async function saveEvent(event: StroomEventObject): Promise<string> {
  log.info({ event }, 'Saving STROOM audit event.')
  const stroomEvent = new StroomEvent({ event })

  const savedEvent = await stroomEvent.save()

  return savedEvent.id
}

export async function processBatch() {
  // This only guards against overlapping runs within a single process. Concurrent runs in other
  // processes (e.g. multiple k8s pods) are made safe by the conditional claim in `claimBatch`.
  if (inFlightBatch) {
    log.debug('STROOM batch already in progress, skipping.')
    return
  }
  inFlightBatch = true
  try {
    await doProcessBatch()
  } finally {
    inFlightBatch = false
  }
}

async function doProcessBatch() {
  await reclaimStaleBatches()

  const batchId = longId()
  const claimedEvents = await claimBatch(batchId)
  if (claimedEvents.length === 0) {
    return
  }

  const batchEvents = await parseClaimedEvents(claimedEvents)
  if (batchEvents.length === 0) {
    return
  }

  try {
    const xml = create({
      Events: {
        '@xmlns': config.stroom.xmlns,
        '@xmlns:stroom': 'stroom',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': config.stroom.schemaLocation,
        '@Version': config.stroom.version,
        Event: batchEvents,
      },
    }).end()
    await sendEvents(xml)
  } catch (error) {
    // Return the batch back to the db.
    await StroomEvent.updateMany({ batchId }, { batchId: '', inFlight: false, $inc: { attempts: 1 } })
    log.warn({ error }, 'Unable to send to STROOM. Incrementing attempts.')
    return
  }
  await StroomEvent.deleteMany({ batchId })

  await logStuckEvents()
}

/**
 * Atomically claim a batch, returning only the events this call actually won.
 */
async function claimBatch(batchId: string) {
  const candidates = await StroomEvent.find({ batchId: '', inFlight: false, attempts: { $lte: MAX_ATTEMPTS } })
    .sort({ createdAt: 1 })
    .limit(config.stroom.batchSizeLimit)
    .select('_id')
    .lean()
  if (candidates.length === 0) {
    return []
  }

  await StroomEvent.updateMany(
    { _id: { $in: candidates.map((stroomEvent) => stroomEvent._id) }, batchId: '', inFlight: false },
    { batchId, inFlight: true },
  )

  // `lean()` to keep a full batch out of Mongoose's document cache. The `event` getter does not run
  // under `lean()`, so the stored JSON string is parsed by `parseClaimedEvents`.
  return await StroomEvent.find({ batchId }).select('event').lean<Array<Pick<StroomEventLean, '_id' | 'event'>>>()
}

/**
 * Parse claimed events, quarantining any that are not valid JSON so that they cannot block the queue.
 */
async function parseClaimedEvents(claimedEvents: Array<Pick<StroomEventLean, '_id' | 'event'>>) {
  const batchEvents: Array<StroomEventObject> = []
  const corruptIds: Array<Types.ObjectId> = []

  for (const stroomEvent of claimedEvents) {
    try {
      batchEvents.push(JSON.parse(stroomEvent.event))
    } catch (error) {
      corruptIds.push(stroomEvent._id)
      log.error({ error, id: stroomEvent._id }, 'STROOM audit event is not valid JSON. Quarantining event.')
    }
  }

  if (corruptIds.length > 0) {
    await StroomEvent.updateMany(
      { _id: { $in: corruptIds } },
      { batchId: '', inFlight: false, attempts: MAX_ATTEMPTS + 1 },
    )
  }

  return batchEvents
}

/**
 * Release batches left claimed by a process that died mid-send, so that they are retried.
 */
async function reclaimStaleBatches() {
  const staleBefore = new Date(Date.now() - config.stroom.staleBatchTimeoutMs)
  const result = await StroomEvent.updateMany(
    { inFlight: true, updatedAt: { $lt: staleBefore } },
    { batchId: '', inFlight: false, $inc: { attempts: 1 } },
  )
  if (result.modifiedCount > 0) {
    log.warn({ count: result.modifiedCount }, 'Reclaimed stale STROOM batches. Incrementing attempts.')
  }
}

async function logStuckEvents() {
  const failedEvents = await StroomEvent.countDocuments({ batchId: '', attempts: { $gt: MAX_ATTEMPTS } })
  if (failedEvents > 0) {
    log.error(
      { failedEvents },
      'Audit events have failed to send after maximum number of attempts. Please take action.',
    )
  }
}
