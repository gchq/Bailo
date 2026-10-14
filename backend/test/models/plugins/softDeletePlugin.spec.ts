import mongoose from 'mongoose'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { softDeletionPlugin } from '../../../src/models/plugins/softDeletePlugin.js'

function getPreHooks(schema: mongoose.Schema, hookName: string): Array<(...args: any[]) => any> {
  const pres = (schema as any).s.hooks._pres
  const hooks = pres instanceof Map ? pres.get(hookName) : pres?.[hookName]
  return hooks ? hooks.map((h: any) => h.fn) : []
}

function runPreHooks(schema: mongoose.Schema, hookName: string, context: any): void {
  for (const fn of getPreHooks(schema, hookName)) {
    fn.call(context)
  }
}

describe('models > plugins > softDeletePlugin', () => {
  let schema: mongoose.Schema

  beforeEach(() => {
    schema = new mongoose.Schema({ name: String, modelId: String })
    schema.plugin(softDeletionPlugin)
  })

  describe('schema additions', () => {
    test('adds deleted field with default false', () => {
      expect(schema.path('deleted')).toBeDefined()
      expect(schema.path('deleted').options.default).toBe(false)
    })

    test('adds deletedBy field', () => {
      expect(schema.path('deletedBy')).toBeDefined()
    })

    test('adds deletedAt field', () => {
      expect(schema.path('deletedAt')).toBeDefined()
    })
  })

  describe('instance methods', () => {
    describe('delete', () => {
      test('sets deleted to true and deletedAt', async () => {
        const context: Record<string, any> = {
          deleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          save: vi.fn().mockResolvedValue(undefined),
        }

        await schema.methods.delete.call(context)

        expect(context.deleted).toBe(true)
        expect(context.deletedAt).toBeDefined()
        expect(context.save).toHaveBeenCalled()
      })

      test('sets deletedBy when user is provided', async () => {
        const context: Record<string, any> = {
          deleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          save: vi.fn().mockResolvedValue(undefined),
        }

        await schema.methods.delete.call(context, undefined, 'user-1')

        expect(context.deletedBy).toBe('user-1')
      })

      test('does not set deletedBy when user is not provided', async () => {
        const context: Record<string, any> = {
          deleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          save: vi.fn().mockResolvedValue(undefined),
        }

        await schema.methods.delete.call(context)

        expect(context.deletedBy).toBeUndefined()
      })

      test('passes session to save', async () => {
        const mockSession = {} as mongoose.ClientSession
        const context: Record<string, any> = {
          deleted: false,
          save: vi.fn().mockResolvedValue(undefined),
        }

        await schema.methods.delete.call(context, mockSession)

        expect(context.save).toHaveBeenCalledWith({ session: mockSession })
      })
    })

    describe('deleteOne', () => {
      test('sets deleted to true and deletedAt', async () => {
        const context: Record<string, any> = {
          deleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          save: vi.fn().mockResolvedValue(undefined),
        }

        await schema.methods.deleteOne.call(context)

        expect(context.deleted).toBe(true)
        expect(context.deletedAt).toBeDefined()
        expect(context.save).toHaveBeenCalled()
      })

      test('sets deletedBy when user is provided', async () => {
        const context: Record<string, any> = {
          deleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          save: vi.fn().mockResolvedValue(undefined),
        }

        await schema.methods.deleteOne.call(context, undefined, 'user-1')

        expect(context.deletedBy).toBe('user-1')
      })
    })

    describe('restore', () => {
      test('sets deleted to false', async () => {
        const context: Record<string, any> = {
          deleted: true,
          save: vi.fn().mockResolvedValue(undefined),
        }

        await schema.methods.restore.call(context)

        expect(context.deleted).toBe(false)
        expect(context.save).toHaveBeenCalled()
      })

      test('passes session to save', async () => {
        const mockSession = {} as mongoose.ClientSession
        const context: Record<string, any> = {
          deleted: true,
          save: vi.fn().mockResolvedValue(undefined),
        }

        await schema.methods.restore.call(context, mockSession)

        expect(context.save).toHaveBeenCalledWith({ session: mockSession })
      })
    })
  })

  describe('static methods', () => {
    describe('deleteOne', () => {
      test('calls updateOne with deleted fields', async () => {
        const mockUpdateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 })
        const context = { updateOne: mockUpdateOne }

        await Reflect.apply(schema.statics.deleteOne, context, [{ id: '123' }])

        expect(mockUpdateOne).toHaveBeenCalledWith(
          { id: '123' },
          expect.objectContaining({ deleted: true, deletedAt: expect.any(String) }),
          { session: undefined },
        )
      })

      test('includes deletedBy when user is provided', async () => {
        const mockUpdateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 })
        const context = { updateOne: mockUpdateOne }

        await Reflect.apply(schema.statics.deleteOne, context, [{ id: '123' }, undefined, 'user-1'])

        expect(mockUpdateOne).toHaveBeenCalledWith(
          { id: '123' },
          expect.objectContaining({ deletedBy: 'user-1' }),
          expect.any(Object),
        )
      })
    })

    describe('deleteMany', () => {
      test('calls updateMany with deleted fields', async () => {
        const mockUpdateMany = vi.fn().mockResolvedValue({ modifiedCount: 3 })
        const context = { updateMany: mockUpdateMany }

        await Reflect.apply(schema.statics.deleteMany, context, [{ organisation: 'test' }])

        expect(mockUpdateMany).toHaveBeenCalledWith(
          { organisation: 'test' },
          expect.objectContaining({ deleted: true, deletedAt: expect.any(String) }),
          { session: undefined },
        )
      })

      test('includes deletedBy when user is provided', async () => {
        const mockUpdateMany = vi.fn().mockResolvedValue({ modifiedCount: 3 })
        const context = { updateMany: mockUpdateMany }

        await Reflect.apply(schema.statics.deleteMany, context, [{}, undefined, 'user-2'])

        expect(mockUpdateMany).toHaveBeenCalledWith(
          {},
          expect.objectContaining({ deletedBy: 'user-2' }),
          expect.any(Object),
        )
      })
    })

    describe('findByIdAndDelete', () => {
      test('calls findByIdAndUpdate with deleted fields', async () => {
        const mockFindByIdAndUpdate = vi.fn().mockResolvedValue({})
        const context = { findByIdAndUpdate: mockFindByIdAndUpdate }

        await Reflect.apply(schema.statics.findByIdAndDelete, context, ['abc-123'])

        expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
          'abc-123',
          expect.objectContaining({ deleted: true, deletedAt: expect.any(String) }),
          { new: true },
        )
      })

      test('passes session in options', async () => {
        const mockSession = {} as mongoose.ClientSession
        const mockFindByIdAndUpdate = vi.fn().mockResolvedValue({})
        const context = { findByIdAndUpdate: mockFindByIdAndUpdate }

        await Reflect.apply(schema.statics.findByIdAndDelete, context, ['abc-123', mockSession])

        expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('abc-123', expect.objectContaining({ deleted: true }), {
          new: true,
          session: mockSession,
        })
      })

      test('includes deletedBy when user is provided', async () => {
        const mockFindByIdAndUpdate = vi.fn().mockResolvedValue({})
        const context = { findByIdAndUpdate: mockFindByIdAndUpdate }

        await Reflect.apply(schema.statics.findByIdAndDelete, context, ['abc-123', undefined, 'user-3'])

        expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
          'abc-123',
          expect.objectContaining({ deletedBy: 'user-3' }),
          expect.any(Object),
        )
      })
    })

    describe('findOneAndDelete', () => {
      test('calls findOneAndUpdate with deleted fields', async () => {
        const mockFindOneAndUpdate = vi.fn().mockResolvedValue({})
        const context = { findOneAndUpdate: mockFindOneAndUpdate }

        await Reflect.apply(schema.statics.findOneAndDelete, context, [{ name: 'test' }])

        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
          { name: 'test' },
          expect.objectContaining({ deleted: true, deletedAt: expect.any(String) }),
          { new: true },
        )
      })

      test('passes session in options', async () => {
        const mockSession = {} as mongoose.ClientSession
        const mockFindOneAndUpdate = vi.fn().mockResolvedValue({})
        const context = { findOneAndUpdate: mockFindOneAndUpdate }

        await Reflect.apply(schema.statics.findOneAndDelete, context, [{ name: 'test' }, mockSession])

        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
          { name: 'test' },
          expect.objectContaining({ deleted: true }),
          { new: true, session: mockSession },
        )
      })

      test('includes deletedBy when user is provided', async () => {
        const mockFindOneAndUpdate = vi.fn().mockResolvedValue({})
        const context = { findOneAndUpdate: mockFindOneAndUpdate }

        await Reflect.apply(schema.statics.findOneAndDelete, context, [{ name: 'test' }, undefined, 'user-4'])

        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
          { name: 'test' },
          expect.objectContaining({ deletedBy: 'user-4' }),
          expect.any(Object),
        )
      })
    })
  })

  describe('pre-hook: find', () => {
    test('excludes soft-deleted documents by default', async () => {
      const context = {
        _conditions: {},
        where: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
      }

      runPreHooks(schema, 'find', context)

      expect(context.or).toHaveBeenCalledWith([{ deleted: { $exists: false } }, { deleted: false }])
    })

    test('queries deleted documents when deleted condition is set', async () => {
      const context = {
        _conditions: { deleted: true },
        where: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
      }

      runPreHooks(schema, 'find', context)

      expect(context.where).toHaveBeenCalledWith('deleted')
      expect(context.equals).toHaveBeenCalledWith(true)
      expect(context.or).not.toHaveBeenCalled()
    })
  })

  describe('pre-hook: findOne', () => {
    test('excludes soft-deleted documents by default', async () => {
      const context = {
        _conditions: {},
        where: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
      }

      runPreHooks(schema, 'findOne', context)

      expect(context.or).toHaveBeenCalledWith([{ deleted: { $exists: false } }, { deleted: false }])
    })

    test('queries deleted documents when deleted condition is set', async () => {
      const context = {
        _conditions: { deleted: true },
        where: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
      }

      runPreHooks(schema, 'findOne', context)

      expect(context.where).toHaveBeenCalledWith('deleted')
      expect(context.equals).toHaveBeenCalledWith(true)
    })
  })

  describe('pre-hook: countDocuments', () => {
    test('excludes soft-deleted documents by default', async () => {
      const context = {
        _conditions: {},
        where: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
      }

      runPreHooks(schema, 'countDocuments', context)

      expect(context.or).toHaveBeenCalledWith([{ deleted: { $exists: false } }, { deleted: false }])
    })

    test('queries deleted documents when deleted condition is set', async () => {
      const context = {
        _conditions: { deleted: true },
        where: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
      }

      runPreHooks(schema, 'countDocuments', context)

      expect(context.where).toHaveBeenCalledWith('deleted')
      expect(context.equals).toHaveBeenCalledWith(true)
    })
  })

  describe('pre-hook: distinct', () => {
    test('excludes soft-deleted documents by default', async () => {
      const context = {
        _conditions: {},
        where: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
      }

      runPreHooks(schema, 'distinct', context)

      expect(context.or).toHaveBeenCalledWith([{ deleted: { $exists: false } }, { deleted: false }])
    })

    test('queries deleted documents when deleted condition is set', async () => {
      const context = {
        _conditions: { deleted: true },
        where: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
      }

      runPreHooks(schema, 'distinct', context)

      expect(context.where).toHaveBeenCalledWith('deleted')
      expect(context.equals).toHaveBeenCalledWith(true)
    })
  })

  describe('pre-hook: aggregate', () => {
    test('prepends deleted filter to main pipeline', async () => {
      const pipeline: any[] = [{ $group: { _id: '$name' } }]
      const context = { pipeline: () => pipeline }

      runPreHooks(schema, 'aggregate', context)

      expect(pipeline[0]).toEqual({ $match: { deleted: { $ne: true } } })
      expect(pipeline[1]).toEqual({ $group: { _id: '$name' } })
    })

    test('transforms simple-form $lookup to pipeline form with deleted filter', async () => {
      const pipeline: any[] = [
        { $lookup: { from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' } },
      ]
      const context = { pipeline: () => pipeline }

      runPreHooks(schema, 'aggregate', context)

      expect(pipeline[1].$lookup).toEqual({
        from: 'v2_models',
        let: { joinValue: '$modelId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$id', '$$joinValue'] },
              deleted: { $ne: true },
            },
          },
        ],
        as: 'model',
      })
    })

    test('prepends deleted filter to existing pipeline-form $lookup', async () => {
      const subPipeline: any[] = [{ $match: { $expr: { $eq: ['$card.schemaId', '$$schemaId'] } } }, { $count: 'count' }]
      const pipeline: any[] = [
        { $lookup: { from: 'v2_models', let: { schemaId: '$id' }, pipeline: subPipeline, as: 'modelUsage' } },
      ]
      const context = { pipeline: () => pipeline }

      runPreHooks(schema, 'aggregate', context)

      expect(subPipeline[0]).toEqual({ $match: { deleted: { $ne: true } } })
      expect(subPipeline[1]).toEqual({ $match: { $expr: { $eq: ['$card.schemaId', '$$schemaId'] } } })
      expect(subPipeline[2]).toEqual({ $count: 'count' })
    })

    test('leaves non-$lookup stages untouched', async () => {
      const pipeline: any[] = [
        { $match: { organisation: 'test' } },
        { $group: { _id: '$modelId' } },
        { $sort: { count: -1 } },
      ]
      const context = { pipeline: () => pipeline }

      runPreHooks(schema, 'aggregate', context)

      expect(pipeline).toEqual([
        { $match: { deleted: { $ne: true } } },
        { $match: { organisation: 'test' } },
        { $group: { _id: '$modelId' } },
        { $sort: { count: -1 } },
      ])
    })

    test('handles multiple $lookup stages in same pipeline', async () => {
      const pipeline: any[] = [
        { $lookup: { from: 'v2_responses', localField: '_id', foreignField: 'parentId', as: 'responses' } },
        { $match: { responses: { $size: 0 } } },
        { $lookup: { from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' } },
      ]
      const context = { pipeline: () => pipeline }

      runPreHooks(schema, 'aggregate', context)

      expect(pipeline[0]).toEqual({ $match: { deleted: { $ne: true } } })
      expect(pipeline[1].$lookup.from).toBe('v2_responses')
      expect(pipeline[1].$lookup.pipeline).toBeDefined()
      expect(pipeline[3].$lookup.from).toBe('v2_models')
      expect(pipeline[3].$lookup.pipeline).toBeDefined()
    })

    test('handles pipeline with no $lookup stages', async () => {
      const pipeline: any[] = [{ $match: { active: true } }, { $count: 'total' }]
      const context = { pipeline: () => pipeline }

      runPreHooks(schema, 'aggregate', context)

      expect(pipeline).toEqual([
        { $match: { deleted: { $ne: true } } },
        { $match: { active: true } },
        { $count: 'total' },
      ])
    })

    test('handles empty pipeline', async () => {
      const pipeline: any[] = []
      const context = { pipeline: () => pipeline }

      runPreHooks(schema, 'aggregate', context)

      expect(pipeline).toEqual([{ $match: { deleted: { $ne: true } } }])
    })
  })
})
