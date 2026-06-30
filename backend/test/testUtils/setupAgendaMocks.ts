import { vi } from 'vitest'

const agendaMethods = vi.hoisted(() => ({
  start: vi.fn(),
  on: vi.fn(),
  define: vi.fn(),
  schedule: vi.fn(),
  every: vi.fn(),
  cancel: vi.fn(),
}))

vi.mock('agenda', () => {
  return {
    Agenda: class {
      start = agendaMethods.start
      on = agendaMethods.on
      define = agendaMethods.define
      schedule = agendaMethods.schedule
      every = agendaMethods.every
      cancel = agendaMethods.cancel
    },
  }
})

vi.mock('@agendajs/mongo-backend', () => ({
  MongoBackend: vi.fn(),
}))

export { agendaMethods }
