import { beforeEach, describe, expect, test, vi } from 'vitest'

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

beforeEach(() => {
  vi.resetModules()
})

describe('scheduler', () => {
  test('getScheduler throws if scheduler not started', async () => {
    const { getScheduler } = await import('../../src/services/schedule/scheduler.js')

    expect(() => getScheduler()).toThrow('Scheduler has not been started')
  })

  test('startScheduler initialises and starts agenda', async () => {
    const { getScheduler, startScheduler } = await import('../../src/services/schedule/scheduler.js')

    const agenda = await startScheduler()
    expect(agenda).toBeDefined()
    expect(agenda.start).toHaveBeenCalledOnce()
    expect(getScheduler()).toBe(agenda)
  })
})
