import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getScheduler, startScheduler } from '../../src/services/schedule/scheduler.js'

vi.mock('agenda', () => {
  return {
    Agenda: class {
      start = vi.fn().mockResolvedValue(undefined)
      on = vi.fn()
    },
  }
})

vi.mock('@agendajs/mongo-backend', () => ({
  MongoBackend: vi.fn(),
}))

vi.mock('../../src/utils/database.js', () => ({
  getConnectionURI: () => 'mongodb://test',
}))

vi.mock('../../src/services/log.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}))

describe('scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('getScheduler throws if scheduler not started', () => {
    expect(() => getScheduler()).toThrow('Scheduler has not been started')
  })

  test('startScheduler initialises and starts agenda', async () => {
    const agenda = await startScheduler()
    expect(agenda).toBeDefined()
    expect(agenda.start).toHaveBeenCalledOnce()
    expect(getScheduler()).toBe(agenda)
  })
})
