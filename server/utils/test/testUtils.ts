import supertest from 'supertest'
import { server } from '../../index'

export function authenticatedGetRequest(path: string) {
  const request = supertest(server)
  return request
    .get(path)
    .set('x-userid', 'user')
    .set('x-email', 'test@example.com')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
}

export function authenticatedPostRequest(path: string) {
  const request = supertest(server)
  return request
    .post(path)
    .set('x-userid', 'user')
    .set('x-email', 'test@example.com')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
}

export function authenticatedPutRequest(path: string) {
  const request = supertest(server)
  return request
    .put(path)
    .set('x-userid', 'user')
    .set('x-email', 'test@example.com')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
}

export function authenticatedDeleteRequest(path: string) {
  const request = supertest(server)
  return request
    .delete(path)
    .set('x-userid', 'user')
    .set('x-email', 'test@example.com')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
}

export function validateTestRequest(res: any) {
  expect(res.header['content-type']).toBe('application/json; charset=utf-8')
  expect(res.statusCode).toBe(200)
  expect(res.body).not.toBe(undefined)
}
