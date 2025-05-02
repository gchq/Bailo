import { PassThrough } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import {
  getImageTagManifest,
  getRegistryLayerStream,
  listImageTags,
  listModelRepos,
} from '../../src/clients/registry.js'

const mockHttpService = vi.hoisted(() => {
  return {
    getHttpsAgent: vi.fn(() => 'mock agent'),
  }
})
vi.mock('../../src/services/http.js', () => mockHttpService)

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(() => ({ ok: true, body: new PassThrough(), text: vi.fn(), json: vi.fn() })),
}))
vi.mock('node-fetch', async () => fetchMock)

describe('clients > registry', () => {
  test('getImageTagManifest > success', async () => {
    const mockManifest = {
      schemaVersion: 2,
      mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      config: {
        mediaType: 'application/vnd.docker.container.image.v1+json',
        size: 1,
        digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      },
      layers: [],
    }

    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => mockManifest),
      body: new PassThrough(),
    })

    const response = await getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(mockManifest)
  })

  test('getImageTagManifest > cannot reach registry', async () => {
    fetchMock.default.mockRejectedValueOnce('Error')
    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('getImageTagManifest > unrecognised error response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
      body: new PassThrough(),
    })
    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Unrecognised response returned by the registry.')
  })

  test('getImageTagManifest > unrecognised error response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(() => ({
        errors: [
          {
            code: 'NAME_UNKNOWN',
            message: 'repository name not known to registry',
            detail: [Object],
          },
        ],
      })),
      body: new PassThrough(),
    })
    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('getImageTagManifest > malformed response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => 'wrong'),
      body: new PassThrough(),
    })

    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Unrecognised response body when getting image tag manifest.')
  })

  test('getImageTagManifest > missing repositories in response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ fake: 'info' })),
      body: new PassThrough(),
    })

    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Unrecognised response body when getting image tag manifest.')
  })

  test('getImageTagManifest > throw all errors apart from unknown name', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: false,
      text: vi.fn(),
      json: vi.fn(() => ({
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized.',
            detail: {},
          },
        ],
      })),
      body: new PassThrough(),
    })

    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('getRegistryLayerStream > success', async () => {
    const mockedStream = new PassThrough()

    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(),
      body: mockedStream,
    })

    const response = await getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response.body).toStrictEqual(mockedStream)
  })

  test('getRegistryLayerStream > cannot reach registry', async () => {
    fetchMock.default.mockRejectedValueOnce('Error')
    const response = getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('getRegistryLayerStream > unrecognised error response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
      body: new PassThrough(),
    })
    const response = getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    expect(response).rejects.toThrowError('Unrecognised response returned by the registry.')
  })

  test('getRegistryLayerStream > malformed response', async () => {
    const mockPassThrough = new PassThrough()
    mockPassThrough['_events'] = undefined
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(),
      body: mockPassThrough,
    })

    const response = getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    expect(response).rejects.toThrowError('Unrecognised response body when getting image layer blob.')
  })

  test('listModelRepos > only returns model repos', async () => {
    const modelId = 'modelId'
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ repositories: [`${modelId}/repo`, 'wrong/repo'] })),
      body: new PassThrough(),
    })
    const response = await listModelRepos('token', modelId)

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual([`${modelId}/repo`])
  })

  test('listModelRepos > cannot reach registry', async () => {
    fetchMock.default.mockRejectedValueOnce('Error')
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('listModelRepos > unrecognised error response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
      body: new PassThrough(),
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Unrecognised response returned by the registry.')
  })

  test('listModelRepos > unrecognised error response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(() => ({
        errors: [
          {
            code: 'NAME_UNKNOWN',
            message: 'repository name not known to registry',
            detail: [Object],
          },
        ],
      })),
      body: new PassThrough(),
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('listModelRepos > malformed response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => 'wrong'),
      body: new PassThrough(),
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Unrecognised response body when listing model repositories.')
  })

  test('listModelRepos > missing repositories in response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ fake: 'info' })),
      body: new PassThrough(),
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Unrecognised response body when listing model repositories.')
  })

  test('listImageTags > success', async () => {
    const tags = ['tag1', 'tag2']
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ tags })),
      body: new PassThrough(),
    })

    const response = await listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(tags)
  })

  test('listImageTags > malformed response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => 'wrong'),
      body: new PassThrough(),
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).rejects.toThrowError('Unrecognised response body when listing image tags.')
  })

  test('listImageTags > missing repositories in response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ fake: 'info' })),
      body: new PassThrough(),
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).rejects.toThrowError('Unrecognised response body when listing image tags.')
  })

  test('listImageTags > unknown name return empty list', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: false,
      text: vi.fn(),
      json: vi.fn(() => ({
        errors: [
          {
            code: 'NAME_UNKNOWN',
            message: 'repository name not known to registry',
            detail: {},
          },
        ],
      })),
      body: new PassThrough(),
    })

    const response = await listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).toStrictEqual([])
  })

  test('listImageTags > throw all errors apart from unknown name', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: false,
      text: vi.fn(),
      json: vi.fn(() => ({
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized.',
            detail: {},
          },
        ],
      })),
      body: new PassThrough(),
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).rejects.toThrowError('Error response received from registry.')
  })
})
