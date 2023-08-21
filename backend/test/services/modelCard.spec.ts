import { describe, expect, test, vi } from 'vitest'

import { searchModels } from '../../src/services/v2/modelCard.js'

const modelCardModel = vi.hoisted(() => {
  const model: any = {}

  model.aggregate = vi.fn(() => model)
  model.match = vi.fn(() => model)
  model.sort = vi.fn(() => model)
  model.lookup = vi.fn(() => model)
  model.append = vi.fn(() => model)

  return model
})
vi.mock('../../src/models/v2/ModelCard.js', () => ({
  default: modelCardModel,
}))

const arrayAsyncFilter = vi.hoisted(() => {
  return {
    asyncFilter: vi.fn(() => []),
  }
})
vi.mock('../../src/utils/v2/array.js', () => ({
  asyncFilter: arrayAsyncFilter.asyncFilter,
}))

describe('services > modelCard', () => {
  test('searchModels > no filters', async () => {
    const user: any = { dn: 'test' }

    await searchModels(user, [], [], '', undefined)

    expect(arrayAsyncFilter.asyncFilter).toBeCalled()
    expect(modelCardModel.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('searchModels > all filters', async () => {
    const user: any = { dn: 'test' }

    await searchModels(user, ['library'], ['mine'], 'search', 'task')

    expect(arrayAsyncFilter.asyncFilter).toBeCalled()
    expect(modelCardModel.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('searchModels > task no library', async () => {
    const user: any = { dn: 'test' }

    await searchModels(user, [], [], '', 'task')

    expect(arrayAsyncFilter.asyncFilter).toBeCalled()
    expect(modelCardModel.match.mock.calls.at(0)).toMatchSnapshot()
  })

  test('searchModels > bad filter', async () => {
    const user: any = { dn: 'test' }

    expect(() => searchModels(user, [], ['asdf' as any], '')).rejects.toThrowError()
    expect(arrayAsyncFilter.asyncFilter).not.toBeCalled()
  })
})
