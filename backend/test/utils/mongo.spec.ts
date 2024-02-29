import { MongoServerError } from 'mongodb'
import { describe, expect, test } from 'vitest'

import { isMongoServerError } from '../../src/utils/v2/mongo.js'

describe('utils > mongo', () => {
  test('returns true for a mongo server error', async () => {
    const mongoError = new MongoServerError({})
    mongoError.code = 11000
    mongoError.keyValue = {
      mockKey: 'mockValue',
    }
    const result = isMongoServerError(mongoError)
    expect(result).toBe(true)
  })

  test('returns false for an error that is not mongo server error', async () => {
    const result = isMongoServerError(new Error())
    expect(result).toBe(false)
  })

  test('returns false for an error that is not an object', async () => {
    const result = isMongoServerError(null)
    expect(result).toBe(false)
  })
})
