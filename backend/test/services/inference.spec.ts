import { MongoServerError } from 'mongodb'
import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import {
  createInference,
  getInferenceByImage,
  getInferencesByModel,
  removeInference,
  removeInferences,
  updateInference,
} from '../../src/services/inference.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

const InferenceModelMock = getTypedModelMock('InferenceModel')

const configMock = vi.hoisted(() => ({
  inference: {
    authorisationToken: 'test',
  },
}))

vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

vi.mock('../../src/connectors/authorisation/index.js')

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
  getModelCardRevision: vi.fn(),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const registryMocks = vi.hoisted(() => ({
  listModelImages: vi.fn(() => [{ repository: 'test', name: 'nginx', tags: ['latest'] }]),
}))
vi.mock('../../src/services/registry.js', () => registryMocks)

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

const inferenceServiceMocks = vi.hoisted(() => ({
  createInferenceService: vi.fn(() => ({ ok: true, text: vi.fn(), json: vi.fn() })),
  updateInferenceService: vi.fn(() => ({ ok: true, text: vi.fn(), json: vi.fn() })),
  deleteInferenceService: vi.fn(() => ({ ok: true, text: vi.fn(), json: vi.fn() })),
}))

vi.mock('../../src/clients/inferencing.js', () => inferenceServiceMocks)

describe('services > inference', () => {
  test('createInference > simple', async () => {
    const mockUser: any = { dn: 'test' }
    await createInference(mockUser, 'test', inference)

    expect(InferenceModelMock.save).toBeCalled()
    expect(InferenceModelMock).toBeCalled()
  })

  test('createInference > non-existent image', async () => {
    const mockUser: any = { dn: 'test' }
    await expect(() =>
      createInference(mockUser, 'test', { image: 'non-existent', tag: 'image' } as any),
    ).rejects.toThrowError(/^Image non-existent:image was not found on this model./)
  })

  test('createInference > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

    await expect(() => createInference({} as any, 'modelId', inference)).rejects.toThrowError(
      /^You do not have permission/,
    )
  })

  test('createInference > existing service', async () => {
    const mongoError = new MongoServerError({})
    mongoError.code = 11000
    mongoError.keyValue = {
      mockKey: 'mockValue',
    }
    InferenceModelMock.save.mockRejectedValueOnce(mongoError)
    await expect(() => createInference({} as any, 'test', inference)).rejects.toThrowError(
      /^A service with this image already exists./,
    )
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
    expect(InferenceModelMock.findOneAndUpdate).toBeCalled()
  })

  test('updateInference > inference not found', async () => {
    vi.mocked(InferenceModelMock.findOneAndUpdate).mockResolvedValueOnce()
    await expect(() =>
      updateInference({} as any, 'test', 'non-existent', 'image', {
        description: 'New description',
        settings: {
          port: 8000,
          memory: 4,
          processorType: 'cpu',
        },
      }),
    ).rejects.toThrowError(/^The requested inference service was not found./)
  })

  test('updateInference > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

    await expect(() =>
      updateInference({} as any, 'test', 'nginx', 'latest', {
        description: 'New description',
        settings: {
          port: 8000,
          memory: 4,
          processorType: 'cpu',
        },
      }),
    ).rejects.toThrowError(/^You do not have permission/)
  })

  test('removeInference > success', async () => {
    await removeInference({} as any, 'model', 'image', 'tag')
    expect(InferenceModelMock.delete).toBeCalled()
  })

  test('removeInferences > success', async () => {
    const result = await removeInferences({} as any, [
      { modelId: 'model', image: 'image', tag: 'tag' },
      { modelId: 'model', image: 'image2', tag: 'tag' },
      { modelId: 'model2', image: 'image', tag: 'tag' },
    ])

    expect(result).toMatchSnapshot()
    expect(InferenceModelMock.delete).toBeCalledTimes(3)
    expect(inferenceServiceMocks.deleteInferenceService).toBeCalledTimes(3)
    expect(modelMocks.getModelById).toBeCalledTimes(2)
  })

  test('removeInferences > inferencing service does not exist', async () => {
    vi.mocked(InferenceModelMock.findOne).mockResolvedValueOnce()

    await expect(removeInferences({} as any, [{ modelId: 'model', image: 'image', tag: 'tag' }])).rejects.toThrowError(
      'The requested inferencing service was not found.',
    )
  })

  test('removeInferences > no perms', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })
    await expect(removeInferences({} as any, [{ modelId: 'model', image: 'image', tag: 'tag' }])).rejects.toThrowError(
      'You do not have permission',
    )
  })

  test('getInferenceByImage > good', async () => {
    await getInferenceByImage({} as any, 'test', 'nginx', 'latest')
    expect(InferenceModelMock.findOne).toBeCalled()
  })

  test('getInferenceByImage > no permission', async () => {
    InferenceModelMock.findOne.mockResolvedValue({ image: 'nginx', tag: 'latest' })

    vi.mocked(authorisation.model).mockResolvedValue({
      info: 'You do not have permission to view this inference.',
      success: false,
      id: '',
    })
    await expect(() => getInferenceByImage({} as any, 'test', 'nginx', 'latest')).rejects.toThrowError(
      /^You do not have permission to view this inference./,
    )
  })
  test('getInferenceByImage > no inference', async () => {
    InferenceModelMock.findOne.mockResolvedValueOnce(undefined)
    await expect(() => getInferenceByImage({} as any, 'test', 'nginx', 'latest')).rejects.toThrowError(
      /^The requested inferencing service was not found./,
    )
  })

  test('getInferenceByModel > good', async () => {
    InferenceModelMock.find.mockResolvedValue([
      { image: 'nginx', tag: 'latest' },
      { image: 'yolov4', tag: 'latest' },
    ])

    const inference = await getInferencesByModel({} as any, 'modelId')
    expect(inference).toMatchSnapshot()
  })

  test('getInferenceByModel > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false, id: '' })

    await expect(() => getInferencesByModel({} as any, 'modelId')).rejects.toThrowError(/^You do not have permission/)
  })
})
