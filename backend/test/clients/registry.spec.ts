import { PassThrough } from 'node:stream'

import { describe, expect, Mock, test, vi } from 'vitest'

import {
  getImageTagManifest,
  getRegistryLayerStream,
  listImageTags,
  listModelRepos,
} from '../../src/clients/registry.js'

const mockHttpService = vi.hoisted(() => {
  return {
    getHttpsAgent: vi.fn(() => 'mock agent'),
    getHttpsUndiciAgent: vi.fn(() => 'mock agent'),
  }
})
vi.mock('../../src/services/http.js', () => mockHttpService)

global.fetch = vi.fn().mockResolvedValueOnce({
  ok: true,
  body: new ReadableStream(),
  text: vi.fn(),
  json: vi.fn(),
  headers: vi.fn(),
})
// workaround TS being difficult
const fetchMock: Mock = global.fetch as Mock

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

    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => mockManifest),
    })

    const response = await getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response.responseBody).toStrictEqual(mockManifest)
  })

  test('getImageTagManifest > cannot reach registry', async () => {
    fetchMock.mockRejectedValueOnce('Error')
    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('getImageTagManifest > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
    })
    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Unrecognised response returned by the registry.')
  })

  test('getImageTagManifest > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
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
    })
    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('getImageTagManifest > malformed response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => 'wrong'),
    })

    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Unrecognised response body when getting image tag manifest.')
  })

  test('getImageTagManifest > missing repositories in response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ fake: 'info' })),
    })

    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Unrecognised response body when getting image tag manifest.')
  })

  test('getImageTagManifest > throw all errors apart from unknown name', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      json: vi.fn(() => ({
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized.',
            detail: {},
          },
        ],
      })),
    })

    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('getRegistryLayerStream > success', async () => {
    const mockedStream = new ReadableStream()

    fetchMock.mockReturnValueOnce({
      ok: true,
      body: mockedStream,
    })

    const response = await getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response.body).toStrictEqual(mockedStream)
  })

  test('getRegistryLayerStream > cannot reach registry', async () => {
    fetchMock.mockRejectedValueOnce('Error')
    const response = getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('getRegistryLayerStream > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
    })
    const response = getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    expect(response).rejects.toThrowError('Unrecognised response returned by the registry.')
  })

  test('getRegistryLayerStream > malformed response', async () => {
    const mockPassThrough = new PassThrough()
    mockPassThrough['_events'] = undefined
    fetchMock.mockReturnValueOnce({
      ok: true,
      body: mockPassThrough,
    })

    const response = getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    expect(response).rejects.toThrowError('Unrecognised response stream when getting image layer blob.')
  })

  test('listModelRepos > only returns model repos', async () => {
    const modelId = 'modelId'
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ repositories: [`${modelId}/repo`, 'wrong/repo'] })),
    })
    const response = await listModelRepos('token', modelId)

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual([`${modelId}/repo`])
  })

  test('listModelRepos > cannot reach registry', async () => {
    fetchMock.mockRejectedValueOnce('Error')
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('listModelRepos > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Unrecognised response returned by the registry.')
  })

  test('listModelRepos > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
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
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('listModelRepos > malformed response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => 'wrong'),
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Unrecognised response body when listing model repositories.')
  })

  test('listModelRepos > missing repositories in response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ fake: 'info' })),
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Unrecognised response body when listing model repositories.')
  })

  test('listImageTags > success', async () => {
    const tags = ['tag1', 'tag2']
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ tags })),
    })

    const response = await listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(tags)
  })

  test('listImageTags > malformed response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => 'wrong'),
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).rejects.toThrowError('Unrecognised response body when listing image tags.')
  })

  test('listImageTags > missing repositories in response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ fake: 'info' })),
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).rejects.toThrowError('Unrecognised response body when listing image tags.')
  })

  test('listImageTags > unknown name return empty list', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      json: vi.fn(() => ({
        errors: [
          {
            code: 'NAME_UNKNOWN',
            message: 'repository name not known to registry',
            detail: {},
          },
        ],
      })),
    })

    const response = await listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).toStrictEqual([])
  })

  test('listImageTags > throw all errors apart from unknown name', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      json: vi.fn(() => ({
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized.',
            detail: {},
          },
        ],
      })),
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).rejects.toThrowError('Error response received from registry.')
  })
})
