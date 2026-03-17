import { describe, expect, test, vi } from 'vitest'

import { StroomEventObject } from '../../src/models/StroomEvent.js'
import { processBatch, saveEvent } from '../../src/services/stroom.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

const StroomEventModelMock = getTypedModelMock('StroomEventModel')

const logMock = vi.hoisted(() => ({
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
  test('saveEvent > success', async () => {
    await saveEvent({} as StroomEventObject)

    expect(StroomEventModelMock.save).toBeCalled()
  })

  test('processBatch > log on failed events', async () => {
    StroomEventModelMock.updateMany.mockReturnValue({ matchedCount: 1 })
    StroomEventModelMock.find.mockReturnValue(['event 1', 'event 2'])

    await processBatch()

    expect(logMock.error.mock.calls).toMatchSnapshot()
    expect(mockStroomClient.sendEvents).toBeCalled()
  })

  test('processBatch > no new logs', async () => {
    StroomEventModelMock.updateMany.mockReturnValue({ matchedCount: 0 })

    await processBatch()

    expect(mockStroomClient.sendEvents).not.toBeCalled()
    expect(logMock.error).not.toBeCalled()
    expect(logMock.warn).not.toBeCalled()
  })

  test('processBatch > cannot send logs', async () => {
    StroomEventModelMock.updateMany.mockReturnValue({ matchedCount: 0 })
    mockStroomClient.sendEvents.mockRejectedValueOnce({})

    await processBatch()

    expect(mockStroomClient.sendEvents).not.toBeCalled()
    expect(logMock.error).not.toBeCalled()
    expect(logMock.warn.mock.calls).toMatchSnapshot()
  })
})
