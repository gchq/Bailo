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
}

export function testPost(path: string, fixture: Fixture) {
  const request = supertest(server)

  return request.post(path).send(fixture.body as object)
}

export function testGet(path: string) {
  const request = supertest(server)

  return request.get(path)
}
