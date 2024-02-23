import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/v2/authorisation/index.js'
import {
  createInference,
  getInferenceByImage,
  getInferencesByModel,
  updateInference,
} from '../../src/services/v2/inference.js'

vi.mock('../../src/connectors/v2/authorisation/index.js')

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
  getModelCardRevision: vi.fn(),
}))
vi.mock('../../src/services/v2/model.js', () => modelMocks)

const registryMocks = vi.hoisted(() => ({
  listModelImages: vi.fn(() => [{ repository: 'test', name: 'nginx', tags: ['latest'] }]),
}))
vi.mock('../../src/services/v2/registry.js', () => registryMocks)

const inference = {
  image: 'nginx',
  tag: 'latest',
  description: 'test',
  settings: {
    processorType: 'cpu',
    port: 8000,
    memory: 1,
  },
}

const inferenceModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.updateMany = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)
  obj.filter = vi.fn(() => obj)

  const model: any = vi.fn((params) => ({ ...obj, ...params }))
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/Inference.js', () => ({ default: inferenceModelMocks }))

describe('services > inference', () => {
  test('createInference > simple', async () => {
    const mockUser: any = { dn: 'test' }
    await createInference(mockUser, 'test', inference)

    expect(inferenceModelMocks.save).toBeCalled()
    expect(inferenceModelMocks).toBeCalled()
  })

  test('createInference > non-existent image', async () => {
    const mockUser: any = { dn: 'test' }
    expect(() =>
      createInference(mockUser, 'test', { image: 'non-existent', tag: 'image' } as any),
    ).rejects.toThrowError(/^Image non-existent:image was not found on this model./)
  })
  test('updateInference > success', async () => {
    await updateInference({} as any, 'test', 'nginx', 'latest', {
      description: 'New description',
      settings: {
        port: 8000,
        memory: 4,
        processorType: 'cpu',
      },
    })
    expect(inferenceModelMocks.findOneAndUpdate).toBeCalled()
  })
  test('getInferenceByImage > good', async () => {
    await getInferenceByImage({} as any, 'test', 'nginx', 'latest')
    expect(inferenceModelMocks.findOne).toBeCalled()
  })

  test('getInferenceByImage > no permission', async () => {
    inferenceModelMocks.findOne.mockResolvedValue({ image: 'nginx', tag: 'latest' })

    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'You do not have permission to view this inference.',
      success: false,
      id: '',
    })
    expect(() => getInferenceByImage({} as any, 'test', 'non-existant', 'image')).rejects.toThrowError(
      /^You do not have permission to view this inference./,
    )
  })
  test('getInferenceByImage > no inference', async () => {
    inferenceModelMocks.findOne.mockResolvedValueOnce(undefined)
    expect(() => getInferenceByImage({} as any, 'test', 'non-existent', 'image')).rejects.toThrowError(
      /^The requested inferencing service was not found./,
    )
  })

  test('getInferenceByModel > good', async () => {
    modelMocks.getModelById.mockResolvedValue('modelId')
    inferenceModelMocks.find.mockResolvedValue([
      { image: 'nginx', tag: 'latest' },
      { image: 'yolov4', tag: 'latest' },
    ])

    const inference = await getInferencesByModel({} as any, 'modelId')
    expect(inference).toMatchSnapshot()
  })
})
