import { describe, expect, test, vi } from 'vitest'

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

const xmlMock = vi.hoisted(() => ({
  create: vi.fn(() => ({ end: vi.fn() })),
}))
vi.mock('xmlbuilder2', () => xmlMock)

describe('services > stroom', () => {
  const event = { EventDetail: { TypeId: 'ViewUserToken' } } as StroomEventObject

  test('saveEvent > success', async () => {
    await saveEvent(event)

    expect(StroomEventModelMock).toHaveBeenCalledWith({ event })
    expect(StroomEventModelMock.save).toHaveBeenCalled()
  })

  test('processBatch > success', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce([event])
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(mockStroomClient.sendEvents).toHaveBeenCalled()
    expect(StroomEventModelMock.deleteMany).toHaveBeenCalled()
    expect(logMock.error).not.toHaveBeenCalled()
    expect(logMock.warn).not.toHaveBeenCalled()
  })

  test('processBatch > log on failed events', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(1)
    StroomEventModelMock.lean.mockReturnValueOnce([event])
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 1 })

    await processBatch()

    expect(logMock.error.mock.calls).toMatchSnapshot()
    expect(mockStroomClient.sendEvents).toHaveBeenCalled()
    expect(StroomEventModelMock.deleteMany).toHaveBeenCalled()
    expect(logMock.warn).not.toHaveBeenCalled()
  })

  test('processBatch > no events', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce([])

    await processBatch()

    expect(mockStroomClient.sendEvents).not.toHaveBeenCalled()
    expect(StroomEventModelMock.updateMany).not.toHaveBeenCalled()
  })

  test('processBatch > no updates', async () => {
    StroomEventModelMock.countDocuments.mockReturnValueOnce(0)
    StroomEventModelMock.lean.mockReturnValueOnce([event])
    StroomEventModelMock.updateMany.mockReturnValueOnce({ matchedCount: 0 })

    await processBatch()

    expect(mockStroomClient.sendEvents).not.toHaveBeenCalled()
  })

  test('processBatch > error sending events', async () => {
    StroomEventModelMock.updateMany.mockReturnValue({ matchedCount: 1 })
    mockStroomClient.sendEvents.mockRejectedValueOnce({})

    await processBatch()

    expect(logMock.error).not.toHaveBeenCalled()
    expect(logMock.warn.mock.calls).toMatchSnapshot()
  })
})
