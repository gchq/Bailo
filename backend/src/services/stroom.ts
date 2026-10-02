import { Readable } from 'node:stream'

import { Types } from 'mongoose'
import { create, fragment } from 'xmlbuilder2'

import { sendEvents } from '../clients/stroom.js'
import StroomEvent, { StroomEventLean, StroomEventObject } from '../models/StroomEvent.js'
import config from '../utils/config.js'
import { longId } from '../utils/id.js'
import log from './log.js'

const MAX_ATTEMPTS = 3

// Placeholder element used only to split the root element into an open and a close tag.
const ROOT_PLACEHOLDER = 'BailoEventPlaceholder'

let inFlightBatch = false

export async function saveEvent(event: StroomEventObject): Promise<string> {
  log.debug({ event }, 'Saving STROOM audit event.')
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
  const claimedCount = await claimBatch(batchId)
  if (claimedCount === 0) {
    return
  }

  const corruptIds: Array<Types.ObjectId> = []
  try {
    await sendEvents(Readable.from(streamBatchAsXml(batchId, corruptIds)))
  } catch (error) {
    // Return the batch back to the db.
    await StroomEvent.updateMany({ batchId }, { batchId: '', inFlight: false, $inc: { attempts: 1 } })
    log.warn({ error }, 'Unable to send to STROOM. Incrementing attempts.')
    return
  }
  await quarantineCorruptEvents(corruptIds)
  await StroomEvent.deleteMany({ batchId })

  await logStuckEvents()
}

/**
 * Atomically claim a batch, returning the number of events this call actually won.
 */
async function claimBatch(batchId: string) {
  const candidates = await StroomEvent.find({ batchId: '', inFlight: false, attempts: { $lte: MAX_ATTEMPTS } })
    .sort({ createdAt: 1 })
    .limit(config.stroom.batchSizeLimit)
    .select('_id')
    .lean()
  if (candidates.length === 0) {
    return 0
  }

  const result = await StroomEvent.updateMany(
    { _id: { $in: candidates.map((stroomEvent) => stroomEvent._id) }, batchId: '', inFlight: false },
    { batchId, inFlight: true },
  )

  return result.modifiedCount
}

/**
 * Yield the batch as XML one event at a time, so that a whole batch is never held in memory at once.
 * Events that are not valid JSON are skipped, and their ids collected in `corruptIds`.
 */
async function* streamBatchAsXml(batchId: string, corruptIds: Array<Types.ObjectId>) {
  const [openTag, closeTag] = buildRootTags()
  yield openTag

  const cursor = StroomEvent.find({ batchId })
    .select('event')
    .lean<Array<Pick<StroomEventLean, '_id' | 'event'>>>()
    .cursor()
  for await (const stroomEvent of cursor) {
    let event: StroomEventObject
    try {
      event = JSON.parse(stroomEvent.event)
    } catch (error) {
      corruptIds.push(stroomEvent._id)
      log.error({ error, id: stroomEvent._id }, 'STROOM audit event is not valid JSON. Quarantining event.')
      continue
    }
    yield fragment().ele({ Event: event }).end({ headless: true })
  }

  yield closeTag
}

/**
 * Build the root element around a placeholder child, then split on that child to get the open and close
 * tags. This keeps attribute serialisation and escaping the responsibility of xmlbuilder2.
 */
function buildRootTags() {
  return create({
    Events: {
      '@xmlns': config.stroom.xmlns,
      '@xmlns:stroom': 'stroom',
      '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@xsi:schemaLocation': config.stroom.schemaLocation,
      '@Version': config.stroom.version,
      [ROOT_PLACEHOLDER]: {},
    },
  })
    .end()
    .split(`<${ROOT_PLACEHOLDER}/>`)
}

/**
 * Mark events as having exhausted their attempts, so that they cannot block subsequent batches.
 */
async function quarantineCorruptEvents(corruptIds: Array<Types.ObjectId>) {
  if (corruptIds.length === 0) {
    return
  }
  await StroomEvent.updateMany(
    { _id: { $in: corruptIds } },
    { batchId: '', inFlight: false, attempts: MAX_ATTEMPTS + 1 },
  )
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
