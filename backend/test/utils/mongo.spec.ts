import { MongoServerError } from 'mongodb'
import { describe, expect, test, vi } from 'vitest'

import { isHydratedMongoDoc, isMongoServerError } from '../../src/utils/mongo.js'

const mongooseMocks = vi.hoisted(() => ({
  isValidObjectId: vi.fn(() => true),
}))
vi.mock('mongoose', () => mongooseMocks)

describe('utils > mongo', () => {
  describe('isMongoServerError', () => {
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

  describe('isHydratedMongoDoc', () => {
    test('success', () => {
      expect(
        isHydratedMongoDoc({
          $isNew: true,
          $get: vi.fn(),
          toObject: vi.fn(),
          _id: '_id',
        }),
      ).toBe(true)
    })

    test('fail > missing properties', () => {
      expect(isHydratedMongoDoc({})).toBe(false)
    })

    test('fail > not an object', () => {
      expect(isHydratedMongoDoc('true')).toBe(false)
    })

    test('fail > not isValidObjectId', () => {
      mongooseMocks.isValidObjectId.mockReturnValueOnce(false)
      expect(
        isHydratedMongoDoc({
          $isNew: true,
          $get: vi.fn(),
          toObject: vi.fn(),
          _id: '_id',
        }),
      ).toBe(false)
    })
  })
})
