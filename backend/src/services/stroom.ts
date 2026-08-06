import { create } from 'xmlbuilder2'

import { sendEvents } from '../clients/stroom.js'
import StroomEvent, { StroomEventObject } from '../models/StroomEvent.js'
import config from '../utils/config.js'
import { longId } from '../utils/id.js'
import log from './log.js'

export async function saveEvent(event: StroomEventObject): Promise<string> {
  log.info({ event }, 'Saving STROOM audit event.')
  const stroomEvent = new StroomEvent({ event })

  const savedEvent = await stroomEvent.save()

  return savedEvent.id
}

export async function processBatch() {
  // Check for stuck events
  const failedEvents = await StroomEvent.find({ batchId: '', attempts: { $gt: 3 } })
  if (failedEvents.length > 0) {
    log.error('Audit events have failed to send after maximum number of attempts. Please take action.')
  }

  const batchId = longId()
  // Find events that haven't yet been batched.
  const updateResult = await StroomEvent.updateMany({ batchId: '', attempts: { $lte: 3 } }, { batchId, inFlight: true })
  if (updateResult.matchedCount === 0) {
    return
  }
  const events = await StroomEvent.find({ batchId })

  try {
    const batchEvents = events.map((stroomEvent) => stroomEvent.event)
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
    return events
  }
  await StroomEvent.deleteMany({ batchId })
  return events
}
