import '../../utils/mockMongo'

import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest'

import SchemaModel from '../../models/Schema.js'
import { testUser, uploadSchema } from '../../utils/test/testModels.js'
import { authenticatedGetRequest, validateTestRequest } from '../../utils/test/testUtils.js'

vi.mock('../../utils/user.js', () => {
  return {
    getUser: vi.fn((req: Request, _res: Response, next: NextFunction) => {
      req.user = testUser
      next()
    }),
    ensureUserRole: vi.fn(() => {
      return vi.fn((req: Request, _res: Response, next: NextFunction) => {
        console.log('called')
        next()
      })
    }),
  }
})

describe('test schema routes', () => {
  beforeEach(async () => {
    await SchemaModel.create(uploadSchema)
  })

  test('that we can fetch schemas', async () => {
    const res = await authenticatedGetRequest('/api/v1/schemas').query({ use: 'UPLOAD' })
    validateTestRequest(res)
    expect(res.body.length).toBe(1)
  })

  test('that we can fetch default schema', async () => {
    const res = await authenticatedGetRequest('/api/v1/schema/default').query({ use: 'UPLOAD' })
    validateTestRequest(res)
    expect(res.body.name).toBe('upload-schema')
  })

  test('that we can fetch a schema by its reference', async () => {
    const res = await authenticatedGetRequest(`/api/v1/schema/${uploadSchema.reference}`).query({ use: 'UPLOAD' })
    validateTestRequest(res)
    expect(res.body.name).toBe('upload-schema')
  })

  afterAll(() => {
    mongoose.connection.close()
  })
})
