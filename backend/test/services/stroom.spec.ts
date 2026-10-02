import { Readable } from 'node:stream'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { StroomEventObject } from '../../src/models/StroomEvent.js'
import { processBatch, saveEvent } from '../../src/services/stroom.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

const StroomEventModelMock = getTypedModelMock('StroomEventModel')

const logMock = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/log.js', async () => ({
  default: logMock,
}))

const mockStroomClient = vi.hoisted(() => ({
  sendEvents: vi.fn(),
}))
vi.mock('../../src/clients/stroom.js', () => mockStroomClient)

// Stub a Mongoose query chain that is awaitable (like a query) and iterable (like a cursor)
function mockQuery(docs: Array<unknown>) {
  const chain = {
    sort: () => chain,
    limit: () => chain,
    select: () => chain,
    lean: () => chain,
    cursor: async function* () {
      yield* docs
    },
    then: (onFulfilled: (value: Array<unknown>) => unknown) => Promise.resolve(docs).then(onFulfilled),
  }
  return chain
}

function mockEvent(id: string, typeId: string) {
  return { _id: id, event: JSON.stringify({ EventDetail: { TypeId: typeId } }) }
}

describe('services > stroom', () => {
  // Lazy XML stream that `processBatch` sends to the client, so mocked client has to consume
  let sentXml: string

  beforeEach(() => {
    sentXml = ''
    StroomEventModelMock.find.mockReturnValue(mockQuery([mockEvent('event-1', 'ViewUserToken')]))
    StroomEventModelMock.updateMany.mockResolvedValue({ modifiedCount: 1 })
    StroomEventModelMock.countDocuments.mockResolvedValue(0)
    mockStroomClient.sendEvents.mockImplementation(async (events: Readable) => {
      for await (const chunk of events) {
        sentXml += chunk
      }
      return 'success'
    })
  })

  test('saveEvent > success', async () => {
    const event = { EventDetail: { TypeId: 'ViewUserToken' } } as unknown as StroomEventObject

    await saveEvent(event)

    expect(StroomEventModelMock).toHaveBeenCalledWith({ event })
    expect(StroomEventModelMock.save).toHaveBeenCalled()
  })

  test('processBatch > streams the claimed batch as XML', async () => {
    await processBatch()

    expect(sentXml).toMatchSnapshot()
    expect(StroomEventModelMock.deleteMany).toHaveBeenCalledWith({ batchId: expect.any(String) })
  })

  test('processBatch > no events to claim', async () => {
    StroomEventModelMock.find.mockReturnValue(mockQuery([]))

    await processBatch()

    expect(mockStroomClient.sendEvents).not.toHaveBeenCalled()
    expect(StroomEventModelMock.deleteMany).not.toHaveBeenCalled()
  })

  test('processBatch > claim lost to another process', async () => {
    // The stale-batch reclaim runs first, so only the claim itself reports no modified documents.
    StroomEventModelMock.updateMany.mockResolvedValueOnce({ modifiedCount: 0 }).mockResolvedValueOnce({
      modifiedCount: 0,
    })

    await processBatch()

    expect(mockStroomClient.sendEvents).not.toHaveBeenCalled()
  })

  test('processBatch > returns the batch to the db when the send fails', async () => {
    mockStroomClient.sendEvents.mockRejectedValueOnce(new Error('STROOM is down'))

    await processBatch()

    expect(StroomEventModelMock.updateMany).toHaveBeenLastCalledWith(
      { batchId: expect.any(String) },
      { batchId: '', inFlight: false, $inc: { attempts: 1 } },
    )
    expect(StroomEventModelMock.deleteMany).not.toHaveBeenCalled()
    expect(logMock.warn.mock.calls.at(-1)?.at(1)).toBe('Unable to send to STROOM. Incrementing attempts.')
  })

  test('processBatch > skips and quarantines an event that is not valid JSON', async () => {
    StroomEventModelMock.find.mockReturnValue(
      mockQuery([{ _id: 'corrupt-event', event: 'not json' }, mockEvent('event-1', 'ViewUserToken')]),
    )

    await processBatch()

    expect(sentXml).toMatchSnapshot()
    expect(StroomEventModelMock.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['corrupt-event'] } },
      { batchId: '', inFlight: false, attempts: 4 },
    )
    expect(logMock.error.mock.calls.at(0)?.at(1)).toBe('STROOM audit event is not valid JSON. Quarantining event.')
  })

  test('processBatch > skips a run that overlaps with one already in progress', async () => {
    let releaseSend: () => void = () => {}
    mockStroomClient.sendEvents.mockReturnValueOnce(new Promise<string>((resolve) => (releaseSend = () => resolve(''))))

    const firstRun = processBatch()
    await processBatch()
    releaseSend()
    await firstRun

    expect(mockStroomClient.sendEvents).toHaveBeenCalledTimes(1)
    expect(logMock.debug).toHaveBeenCalledWith('STROOM batch already in progress, skipping.')
  })

  test('processBatch > reclaims batches left in flight by a dead process', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'))

    await processBatch()

    expect(StroomEventModelMock.updateMany.mock.calls.at(0)).toEqual([
      { inFlight: true, updatedAt: { $lt: new Date('2026-01-01T11:50:00.000Z') } },
      { batchId: '', inFlight: false, $inc: { attempts: 1 } },
    ])
    expect(logMock.warn.mock.calls.at(0)?.at(1)).toBe('Reclaimed stale STROOM batches. Incrementing attempts.')

    vi.useRealTimers()
  })

  test('processBatch > logs events that have exhausted their attempts', async () => {
    StroomEventModelMock.countDocuments.mockResolvedValue(2)

    await processBatch()

    expect(StroomEventModelMock.countDocuments).toHaveBeenCalledWith({ batchId: '', attempts: { $gt: 3 } })
    expect(logMock.error.mock.calls.at(0)).toEqual([
      { failedEvents: 2 },
      'Audit events have failed to send after maximum number of attempts. Please take action.',
    ])
  })
})
