import { beforeEach, describe, expect, test, vi } from 'vitest'

import { setTestConfig } from '../testUtils/setupTestConfig.js'

vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    levels: {
      values: {},
    },
  })),
}))

vi.mock('pino-http', () => ({
  pinoHttp: vi.fn(() => {}),
}))

beforeEach(() => {
  vi.resetModules()
})

describe('services > log', () => {
  test('targets > no_color', async () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('NODE_ENV', 'development')

    await import('../../src/services/log.js')
    const pino = (await import('pino')).default

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: {
          targets: expect.arrayContaining([
            expect.objectContaining({
              target: 'pino-pretty',
              options: expect.objectContaining({
                colorize: false,
              }),
            }),
          ]),
        },
      }),
    )
  })
  test('targets > instrumentation', async () => {
    setTestConfig({ instrumentation: { enabled: true } })

    await import('../../src/services/log.js')
    const pino = (await import('pino')).default

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: {
          targets: expect.arrayContaining([
            expect.objectContaining({
              target: 'pino-opentelemetry-transport',
            }),
          ]),
        },
      }),
    )
  })

  test('targets > production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    await import('../../src/services/log.js')
    const pino = (await import('pino')).default

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: {
          targets: expect.arrayContaining([
            expect.objectContaining({
              target: 'pino/file',
            }),
          ]),
        },
      }),
    )
  })
})
