import { describe, expect, test, vi } from 'vitest'

import { createModel } from '../../src/services/v2/model.js'

describe('services > model', () => {
  test('createModel > good', async () => {
    const mocks = vi.hoisted(() => {
      const save = vi.fn()

      return {
        save,
        convertStringToId: vi.fn(() => 'model-id'),
        Model: vi.fn(() => ({
          save,
        })),
      }
    })

    vi.mock('../../src/utils/v2/id.js', () => ({
      convertStringToId: mocks.convertStringToId,
    }))

    vi.mock('../../src/models/v2/Model.js', () => ({ default: mocks.Model }))

    vi.mock('../../src/external/v2/authorisation/index.js', async () => ({
      ...((await vi.importActual('../../src/external/v2/authorisation/index.js')) as object),
      default: { userModelAction: vi.fn(() => true) },
    }))

    await createModel({} as any, {} as any)

    expect(mocks.save).toBeCalled()
    expect(mocks.Model).toBeCalled()
  })
})
