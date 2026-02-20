/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, test, vi } from 'vitest'

const configMock = vi.hoisted(
  () =>
    ({
      log: {
        level: 'info',
      },
      instrumentation: {
        enabled: false,
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

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

    const { default: logger } = await import('../../src/services/log.js')
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
    vi.spyOn(configMock.instrumentation, 'enabled', 'get').mockReturnValueOnce(true)

    const { default: logger } = await import('../../src/services/log.js')
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

    const { default: logger } = await import('../../src/services/log.js')
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
