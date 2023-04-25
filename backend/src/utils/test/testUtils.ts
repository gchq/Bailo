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
