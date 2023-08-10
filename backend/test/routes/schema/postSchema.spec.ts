import { NextFunction, Request, Response } from 'express'
import { describe, expect, test, vi } from 'vitest'

import { postSchemaSchema } from '../../../src/routes/v2/schema/postSchema.js'
import { createFixture, testPost } from '../../testUtils/routes.js'

const mockSchemaService = vi.hoisted(() => {
  return {
    addDefaultSchemas: vi.fn(),
    createSchema: vi.fn(),
  }
})
vi.mock('../../../src/services/v2/schema.js', () => mockSchemaService)

// Unable to update implementation using mockImplementation()
const mockUserUtils = vi.hoisted(() => {
  return {
    ensureUserRole: vi.fn(() => {
      return vi.fn((req: Request, _res: Response, next: NextFunction) => {
        next()
      })
    }),
  }
})
vi.mock('../../../src/utils/user.js', () => mockUserUtils)

describe('routes > schema > postSchema', () => {
  test('successfully stores the schema', async () => {
    const fixture = createFixture(postSchemaSchema)
    const res = await testPost(`/api/v2/schemas`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
