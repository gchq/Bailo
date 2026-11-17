import supertest from 'supertest'
import { type z, type ZodSchema } from 'zod'
import { fake, install, seed } from 'zod-schema-faker/v3'

import { server } from '../../src/routes.js'

install()
seed(1337)

export function createFixture<T extends ZodSchema>(schema: T): z.infer<T> {
  return fake(schema)
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
