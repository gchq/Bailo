import { NextFunction, Request, Response } from 'express'
import supertest from 'supertest'
import { expect, vi } from 'vitest'

import { server } from '../../routes.js'
import { testUser } from './testModels.js'

vi.mock('../../utils/user.js', () => {
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

vi.mock('../../utils/config.js', () => {
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

export function authenticatedGetRequest(path: string) {
  const request = supertest(server)
  return request.get(path).set('Content-Type', 'application/json').set('Accept', 'application/json')
}

export function authenticatedPostRequest(path: string) {
  const request = supertest(server)
  return request.post(path).set('Content-Type', 'application/json').set('Accept', 'application/json')
}

export function authenticatedPutRequest(path: string) {
  const request = supertest(server)
  return request.put(path).set('Content-Type', 'application/json').set('Accept', 'application/json')
}

export function authenticatedDeleteRequest(path: string) {
  const request = supertest(server)
  return request.delete(path).set('Content-Type', 'application/json').set('Accept', 'application/json')
}

export function validateTestRequest(res: any) {
  expect(res.header['content-type']).toBe('application/json; charset=utf-8')
  expect(res.statusCode).toBe(200)
  expect(res.body).not.toBe(undefined)
}
