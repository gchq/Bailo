import { beforeEach, describe, expect, test, vi } from 'vitest'

import { type StroomEventObject } from '../../src/models/StroomEvent.js'
import { processBatch, saveEvent } from '../../src/services/stroom.js'
import config from '../../src/utils/config.js'
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

const xmlMock = vi.hoisted(() => ({
  create: vi.fn((_xmlObject?: unknown) => ({ end: vi.fn(() => '<Events />') })),
}))
vi.mock('xmlbuilder2', () => xmlMock)

const idMock = vi.hoisted(() => ({
  longId: vi.fn(() => 'mock-batch-id'),
}))
vi.mock('../../src/utils/id.js', () => idMock)

describe('services > stroom', () => {
  const event = { EventDetail: { TypeId: 'ViewUserToken' } } as StroomEventObject
  const eventString = JSON.stringify(event)
  const candidateEvents = [{ _id: 'event-1', event: eventString }]

  beforeEach(() => {
    mockStroomClient.sendEvents.mockResolvedValue(undefined)
  })

  test('saveEvent > success', async () => {
    const id = await saveEvent(event)

    expect(StroomEventModelMock).toHaveBeenCalledWith({ event })
    expect(StroomEventModelMock.save).toHaveBeenCalled()
    expect(id).toBe('mock-id')
  })

  test('processBatch > success', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0).mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce(candidateEvents)
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(StroomEventModelMock.deleteMany).toHaveBeenCalledWith({ batchId: 'mock-batch-id' })
    expect(logMock.error).not.toHaveBeenCalled()
    expect(logMock.warn).not.toHaveBeenCalled()
    expect(logMock.info).toHaveBeenLastCalledWith({ pendingEvents: 0 }, 'No events pending STROOM batch send.')
  })

  test('processBatch > claims the candidate events before sending', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce(candidateEvents)
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(StroomEventModelMock.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['event-1'] }, batchId: '', inFlight: false },
      { batchId: 'mock-batch-id', inFlight: true },
    )
  })

  test('processBatch > builds the XML payload from the batched events', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce([...candidateEvents, { _id: 'event-2', event: eventString }])
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(xmlMock.create).toHaveBeenCalledWith({
      Events: {
        '@xmlns': config.stroom.xmlns,
        '@xmlns:stroom': 'stroom',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': config.stroom.schemaLocation,
        '@Version': config.stroom.version,
        Event: [event, event],
      },
    })
  })

  test('processBatch > log on failed events', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(1)
    StroomEventModelMock.lean.mockReturnValueOnce([...candidateEvents, { _id: 'event-2', event: eventString }])
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(logMock.error.mock.calls).toMatchSnapshot()
    expect(mockStroomClient.sendEvents).toHaveBeenCalled()
    expect(StroomEventModelMock.deleteMany).toHaveBeenCalled()
    expect(logMock.warn).not.toHaveBeenCalled()
  })

  test('processBatch > log on remaining unbatched events', async () => {
    const remainingEvents = 2
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0).mockReturnValueOnce(remainingEvents)
    StroomEventModelMock.lean.mockReturnValueOnce(candidateEvents)
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(StroomEventModelMock.deleteMany).toHaveBeenCalledWith({ batchId: 'mock-batch-id' })
    expect(logMock.error).not.toHaveBeenCalled()
    expect(logMock.warn).not.toHaveBeenCalled()
    expect(logMock.info).toHaveBeenLastCalledWith(
      { pendingEvents: remainingEvents },
      'Events pending STROOM batch send.',
    )
  })

  test('processBatch > no events', async () => {
    StroomEventModelMock.countDocuments.mockResolvedValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce([])

    await processBatch()

    expect(mockStroomClient.sendEvents).not.toHaveBeenCalled()
    expect(StroomEventModelMock.updateMany).not.toHaveBeenCalled()
    expect(StroomEventModelMock.deleteMany).not.toHaveBeenCalled()
  })

  test('processBatch > no updates', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce(candidateEvents)
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 0 })

    await processBatch()

    expect(mockStroomClient.sendEvents).not.toHaveBeenCalled()
    expect(StroomEventModelMock.deleteMany).not.toHaveBeenCalled()
  })

  test('processBatch > error sending events', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce(candidateEvents)
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })
    mockStroomClient.sendEvents.mockRejectedValueOnce({})

    await processBatch()

    expect(logMock.error).not.toHaveBeenCalled()
    expect(logMock.warn.mock.calls).toMatchSnapshot()
  })

  test('processBatch > returns the batch to the database when sending fails', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce(candidateEvents)
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })
    mockStroomClient.sendEvents.mockRejectedValueOnce(new Error('Unreachable'))

    await processBatch()

    expect(StroomEventModelMock.updateMany).toHaveBeenLastCalledWith(
      { batchId: 'mock-batch-id' },
      { batchId: '', inFlight: false, $inc: { attempts: 1 } },
    )
    expect(StroomEventModelMock.deleteMany).not.toHaveBeenCalled()
  })

  test('processBatch > sends the rest of the batch when an event cannot be parsed', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce([...candidateEvents, { _id: 'event-2', event: '{not json' }])
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 2 })

    await processBatch()

    expect(StroomEventModelMock.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['event-2'] }, batchId: 'mock-batch-id' },
      { batchId: '', inFlight: false, attempts: 4 },
    )
    expect(xmlMock.create).toHaveBeenLastCalledWith({ Events: expect.objectContaining({ Event: [event] }) })
    expect(mockStroomClient.sendEvents).toHaveBeenCalledOnce()
    expect(StroomEventModelMock.deleteMany).toHaveBeenCalledWith({ batchId: 'mock-batch-id' })
    expect(logMock.error).toHaveBeenCalledWith(
      { error: expect.any(SyntaxError), stroomEventId: 'event-2' },
      'Invalid STROOM audit event. Removing it from the batch.',
    )
    expect(logMock.warn).not.toHaveBeenCalled()
  })

  test('processBatch > sends the rest of the batch when an event is not well-formed XML', async () => {
    const invalidEvent = { EventDetail: { TypeId: 'invalid\u0001' } } as StroomEventObject
    xmlMock.create.mockImplementation((xmlObject?: unknown) => ({
      end: vi.fn(() => {
        if (JSON.stringify(xmlObject).includes('\\u0001')) {
          throw new Error('Text data contains invalid characters (well-formed required).')
        }
        return '<Events />'
      }),
    }))
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce([
      { _id: 'event-0', event: JSON.stringify(invalidEvent) },
      ...candidateEvents,
    ])
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 2 })

    await processBatch()

    expect(StroomEventModelMock.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['event-0'] }, batchId: 'mock-batch-id' },
      { batchId: '', inFlight: false, attempts: 4 },
    )
    expect(xmlMock.create).toHaveBeenLastCalledWith({ Events: expect.objectContaining({ Event: [event] }) })
    expect(mockStroomClient.sendEvents).toHaveBeenCalledWith('<Events />')
    expect(StroomEventModelMock.deleteMany).toHaveBeenCalledWith({ batchId: 'mock-batch-id' })
    expect(logMock.warn).not.toHaveBeenCalled()
  })

  test('processBatch > does not send when every event in the batch is invalid', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce([{ _id: 'event-1', event: '{not json' }])
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(StroomEventModelMock.updateMany).toHaveBeenLastCalledWith(
      { _id: { $in: ['event-1'] }, batchId: 'mock-batch-id' },
      { batchId: '', inFlight: false, attempts: 4 },
    )
    expect(mockStroomClient.sendEvents).not.toHaveBeenCalled()
    expect(StroomEventModelMock.deleteMany).not.toHaveBeenCalled()
  })

  test('processBatch > requires the batch XML to be well-formed', async () => {
    const end = vi.fn(() => '<Events />')
    xmlMock.create.mockReturnValue({ end })
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce(candidateEvents)
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(end).toHaveBeenCalledWith({ wellFormed: true })
    expect(end).not.toHaveBeenCalledWith()
  })

  test('processBatch > skips overlapping runs within the same process', async () => {
    let resolveSend: () => void = () => undefined
    mockStroomClient.sendEvents.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve
        }),
    )
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce(candidateEvents)
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    const firstRun = processBatch()
    await processBatch()

    expect(StroomEventModelMock.find).toHaveBeenCalledTimes(1)

    await vi.waitFor(() => expect(mockStroomClient.sendEvents).toHaveBeenCalled())
    resolveSend()
    await firstRun

    expect(StroomEventModelMock.deleteMany).toHaveBeenCalledTimes(1)
  })

  test('processBatch > releases the lock after a failed run', async () => {
    StroomEventModelMock.countDocuments.mockRejectedValueOnce(new Error('Database unavailable'))

    await expect(processBatch()).rejects.toThrow('Database unavailable')

    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce([...candidateEvents, { _id: 'event-2', event: eventString }])
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(mockStroomClient.sendEvents).toHaveBeenCalledOnce()
  })
})
