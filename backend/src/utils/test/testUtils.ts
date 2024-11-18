import supertest from 'supertest'
import { expect } from 'vitest'

import { server } from '../../routes.js'

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
