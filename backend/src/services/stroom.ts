import { create } from 'xmlbuilder2'

import { sendEvents } from '../clients/stroom.js'
import StroomEvent, { StroomEventLean, StroomEventObject } from '../models/StroomEvent.js'
import config from '../utils/config.js'
import { longId } from '../utils/id.js'
import log from './log.js'

const MAX_ATTEMPTS = 3

let inFlightBatch = false

export async function saveEvent(event: StroomEventObject): Promise<string> {
  log.debug({ event }, 'Saving STROOM audit event.')
  const stroomEvent = new StroomEvent({ event })

  const savedEvent = await stroomEvent.save()

  return savedEvent.id
}

export async function processBatch() {
  // This only guards against overlapping runs within a single process
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
  // Check for stuck events
  const failedEvents = await StroomEvent.countDocuments({ batchId: '', attempts: { $gt: MAX_ATTEMPTS } })
  if (failedEvents > 0) {
    log.error(
      { failedEvents },
      'Audit events have failed to send after maximum number of attempts. Please take action.',
    )
  }

  const batchId = longId()
  // Find events that haven't yet been batched.
  const candidateEvents = await StroomEvent.find({ batchId: '', inFlight: false, attempts: { $lte: MAX_ATTEMPTS } })
    .sort({ createdAt: 1 })
    .limit(config.stroom.batchSizeLimit)
    .select('event')
    .lean<Array<Pick<StroomEventLean, '_id' | 'event'>>>()
  if (candidateEvents.length === 0) {
    return
  }

  const updateResult = await StroomEvent.updateMany(
    { _id: { $in: candidateEvents.map((stroomEvent) => stroomEvent._id) }, batchId: '', inFlight: false },
    { batchId, inFlight: true },
  )
  if (updateResult.matchedCount === 0) {
    return
  }

  try {
    const batchEvents = candidateEvents.map((stroomEvent) => JSON.parse(stroomEvent.event))
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
    // Return the batch back to the DB
    await StroomEvent.updateMany({ batchId }, { batchId: '', inFlight: false, $inc: { attempts: 1 } })
    log.warn({ error }, 'Unable to send to STROOM. Incrementing attempts.')
    return
  }

  await StroomEvent.deleteMany({ batchId })

  const pendingEvents = await StroomEvent.countDocuments({ batchId: '', attempts: { $lte: MAX_ATTEMPTS } })
  if (pendingEvents === 0) {
    // still include `pendingEvents` as the key may be useful to filter logs on
    log.info({ pendingEvents }, 'No events pending STROOM batch send.')
  } else {
    log.info({ pendingEvents }, 'Events pending STROOM batch send.')
  }
}
