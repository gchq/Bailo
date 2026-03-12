import { vi } from 'vitest'

// Minimal pino-like logger mock
const log = {
  fatal: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
  child: vi.fn(() => log),
}

export default log

// Minimal pino-http mock
export const httpLog = vi.fn(() => (req: any, _res: any, next?: () => void) => {
  // simulate req.id behaviour
  if (!req.id) {
    req.id = 'test-request-id'
  }
  if (next) {
    next()
  }
})
