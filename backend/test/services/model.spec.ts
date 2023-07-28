import { describe, expect, test, vi } from 'vitest'

import { createModel, getModelById } from '../../src/services/v2/model.js'

const mocks = vi.hoisted(() => {
  const save = vi.fn()
  const findOne = vi.fn()

  const Model: any = vi.fn(() => ({
    save,
  }))

  Model.findOne = findOne

  return {
    save,
    findOne,
    convertStringToId: vi.fn(() => 'model-id'),
    Model,
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

describe('services > model', () => {
  test('createModel > good', async () => {
    await createModel({} as any, {} as any)

    expect(mocks.save).toBeCalled()
    expect(mocks.Model).toBeCalled()
  })

  test('getModelById > good', async () => {
    mocks.findOne.mockResolvedValueOnce('mocked')

    const model = await getModelById({} as any, {} as any)

    expect(mocks.findOne).toBeCalled()
    expect(model).toBe('mocked')
  })
})
