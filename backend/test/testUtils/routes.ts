import { generateMock, GenerateMockOptions } from '@anatine/zod-mock'
import supertest from 'supertest'
import z, { ZodSchema } from 'zod'

import { server } from '../../src/routes.js'

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
  headers?: Record<string, unknown>
}

function applyHeaders<T extends supertest.Test>(req: T, fixture: Fixture) {
  if (fixture.headers) {
    Object.entries(fixture.headers).forEach(([k, v]) => {
      req.set(k, String(v))
    })
  }
  return req
}

export function testDelete(path: string, fixture?: Fixture) {
  let request = supertest(server).delete(path)
  if (fixture) {
    request = applyHeaders(request, fixture)
  }
  return request
}

export function testPost(path: string, fixture: Fixture) {
  let request = supertest(server).post(path)
  request = applyHeaders(request, fixture)
  return request.send(fixture.body as object)
}

export function testPatch(path: string, fixture: Fixture) {
  let request = supertest(server).patch(path)
  request = applyHeaders(request, fixture)
  return request.send(fixture.body as object)
}

export function testGet(path: string, fixture?: Fixture) {
  let request = supertest(server).get(path)
  if (fixture) {
    request = applyHeaders(request, fixture)
  }
  return request
}

export function testPut(path: string, fixture: Fixture) {
  let request = supertest(server).put(path)
  request = applyHeaders(request, fixture)
  return request.send(fixture.body as object)
}
