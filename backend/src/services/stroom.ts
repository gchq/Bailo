import { create } from 'xmlbuilder2'

import { sendEvents } from '../clients/stroom.js'
import StroomEvent, { StroomEventObject } from '../models/StroomEvent.js'
import config from '../utils/config.js'
import { longId } from '../utils/id.js'
import log from './log.js'

let inFlightBatch = false

export async function saveEvent(event: StroomEventObject): Promise<string> {
  log.info({ event }, 'Saving STROOM audit event.')
  const stroomEvent = new StroomEvent({ event })

  const savedEvent = await stroomEvent.save()

  return savedEvent.id
}

export async function processBatch() {
  if (inFlightBatch) {
    log.debug('STROOM batch already in progress, skipping.')
    return
  }
  inFlightBatch = true
  doProcessBatch().finally(() => {
    inFlightBatch = false
  })
}

async function doProcessBatch() {
  // Find events that haven't yet been batched.
  const batchId = longId()
  const targetEvents = await StroomEvent.find({ batchId: '', attempts: { $lte: 3 } })
    .sort({ createdAt: 1 })
    .limit(config.stroom.batchSizeLimit)
    .select('event')
    .lean()
  if (targetEvents.length === 0) {
    return
  }
  await StroomEvent.updateMany(
    { _id: { $in: targetEvents.map((stroomEvent) => stroomEvent._id) } },
    { batchId, inFlight: true },
  )

  try {
    const batchEvents = targetEvents.map((stroomEvent) => JSON.parse(stroomEvent.event))
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

  // Check for stuck events
  const failedEvents = await StroomEvent.countDocuments({ batchId: '', attempts: { $gt: 3 } })
  if (failedEvents > 0) {
    log.error('Audit events have failed to send after maximum number of attempts. Please take action.')
  }
}
