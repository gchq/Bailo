import { faker } from '@faker-js/faker'
import supertest from 'supertest'
import { type z } from 'zod'
import { fake, seed, setFaker } from 'zod-schema-faker/v4'

import { server } from '../../src/routes.js'
import { formatZodIssues } from '../../src/utils/validate.js'

setFaker(faker)
seed(1337)

type FixtureOverrides = Partial<Record<'body' | 'query' | 'params' | 'headers', Record<string, unknown>>>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function applyOverrides(fixture: unknown, overrides: FixtureOverrides) {
  if (!isRecord(fixture)) {
    return fixture
  }
  const merged = { ...fixture }
  for (const [section, values] of Object.entries(overrides)) {
    const generated = merged[section]
    merged[section] = isRecord(generated) ? { ...generated, ...values } : values
  }
  return merged
}

function omitEmptyQueryValues(fixture: unknown) {
  if (!isRecord(fixture) || !isRecord(fixture.query)) {
    return fixture
  }
  const presentEntries = Object.entries(fixture.query).filter(
    ([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0),
  )
  return { ...fixture, query: Object.fromEntries(presentEntries) }
}

/** Validates via `safeParse`, so refinements run: set `mock*Once` values used by refinements afterwards. */
export function createFixture<T extends z.ZodType>(schema: T, overrides: FixtureOverrides = {}): z.infer<T> {
  const fixture = omitEmptyQueryValues(applyOverrides(fake(schema), overrides))
  const result = schema.safeParse(fixture)
  if (!result.success) {
    throw new Error(`Generated fixture does not match schema: ${formatZodIssues(result.error.issues)}`)
  }
  return fixture as z.infer<T>
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
    if (fixture.body) {
      return request.send(fixture.body as object)
    }
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
