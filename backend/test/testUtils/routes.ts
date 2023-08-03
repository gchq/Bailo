import { generateMock, GenerateMockOptions } from '@anatine/zod-mock'
import { NextFunction, Request, Response } from 'express'
import supertest from 'supertest'
import { vi } from 'vitest'
import z, { ZodSchema } from 'zod'

import { server } from '../../src/routes.js'
import { testUser } from '../../src/utils/test/testModels.js'

vi.mock('../../src/utils/user.js', () => {
  return {
    getUser: vi.fn((req: Request, _res: Response, next: NextFunction) => {
      req.user = testUser
      next()
    }),
    ensureUserRole: vi.fn(() => {
      return vi.fn((req: Request, _res: Response, next: NextFunction) => {
        next()
      })
    }),
  }
})

vi.mock('../../src/utils/config.js', () => {
  return {
    __esModule: true,
    default: {
      app: {
        app: {
          protocol: '',
        },
      },
      logging: {
        stroom: {
          enabled: false,
        },
        file: {
          enabled: false,
        },
      },
      minio: {
        connection: {
          endPoint: 'fake',
        },
        buckets: {
          uploads: 'uploads',
        },
      },
      experimental: {
        v2: true,
      },
      oauth: {
        enabled: false,
      },
      ui: {
        seldonVersions: [
          {
            name: 'seldonio - 1.10.0',
            image: 'seldonio/seldon-core-s2i-python37:1.10.0',
          },
        ],
        banner: '',
        registry: '',
      },
    },
  }
})

export function createFixture<T extends ZodSchema>(schema: T, options?: GenerateMockOptions): z.infer<T> {
  return generateMock(schema, {
    seed: 1337,
    ...options,
  })
}

interface Fixture {
  body?: unknown
  query?: unknown
  path?: unknown
}

export function testPost(path: string, fixture: Fixture) {
  const request = supertest(server)

  return request.post(path).send(fixture.body as object)
}

export function testGet(path: string) {
  const request = supertest(server)

  return request.get(path)
}
