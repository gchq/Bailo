import { describe, expect, test, vi } from 'vitest'

import { findSchemasByKind } from './schema.js'

const mockSchemaModel = vi.hoisted(() => {
  return {
    default: {
      find: vi.fn(() => ({ sort: vi.fn() })),
    },
  }
})
vi.mock('../../models/v2/Schema.js', () => mockSchemaModel)

describe('services > schema', () => {
  test('that all schemas can be retrieved', async () => {
    const result = await findSchemasByKind('model')
    expect(result)
  })
})
