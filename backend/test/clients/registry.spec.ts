import { Readable } from 'node:stream'

import { beforeEach, describe, expect, Mock, test, vi } from 'vitest'

import {
  doesLayerExist,
  getImageTagManifest,
  getRegistryLayerStream,
  initialiseUpload,
  listImageTags,
  listModelRepos,
  putManifest,
  uploadLayerMonolithic,
} from '../../src/clients/registry.js'

const mockHttpService = vi.hoisted(() => {
  return {
    getHttpsAgent: vi.fn(() => 'mock agent'),
    getHttpsUndiciAgent: vi.fn(() => 'mock agent'),
  }
})
vi.mock('../../src/services/http.js', () => mockHttpService)

const mockedFetchBodyStream = new ReadableStream()
const fetchMockResponse = new Response(mockedFetchBodyStream, {
  status: 200,
  statusText: 'ok',
  headers: new Headers(),
})
global.fetch = vi.fn()
// workaround TS being difficult
const fetchMock: Mock = global.fetch as Mock

describe('clients > registry', () => {
  beforeEach(() => {
    // globals (e.g. `fetch`) persist changes between tests so always reset to the default mock
    fetchMock.mockResolvedValue(fetchMockResponse)
  })

  test('getImageTagManifest > success', async () => {
    const mockManifest = {
      schemaVersion: 2,
      mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      config: {
        mediaType: 'application/vnd.docker.container.image.v1+json',
        size: 1,
        digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      },
      layers: [
        {
          mediaType: 'application/vnd.docker.container.image.v1+json',
          size: 1,
          digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        },
      ],
    }

    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => mockManifest),
    })

    const response = await getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(mockManifest)
  })

  test('getImageTagManifest > cannot reach registry', async () => {
    fetchMock.mockRejectedValueOnce('Error')
    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    await expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('getImageTagManifest > unable to parse JSON error response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      body: {},
    })
    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    await expect(response).rejects.toThrowError('Unable to parse response body JSON.')
  })

  test('getImageTagManifest > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
    })
    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    await expect(response).rejects.toThrowError('Unrecognised response returned by the registry.')
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

    await expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('getImageTagManifest > malformed response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => 'wrong'),
    })

    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    await expect(response).rejects.toThrowError('Unrecognised response body when getting image tag manifest.')
  })

  test('getImageTagManifest > missing repositories in response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ fake: 'info' })),
    })

    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    await expect(response).rejects.toThrowError('Unrecognised response body when getting image tag manifest.')
  })

  test('getImageTagManifest > throw all errors apart from unknown name', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      json: vi.fn(() => ({
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized.',
            detail: [],
          },
        ],
      })),
    })

    const response = getImageTagManifest('token', { namespace: 'modelId', image: 'image' }, 'tag1')

    await expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('getRegistryLayerStream > success', async () => {
    const response = await getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response.body).toStrictEqual(mockedFetchBodyStream)
  })

  test('getRegistryLayerStream > cannot reach registry', async () => {
    fetchMock.mockRejectedValueOnce('Error')
    const response = getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    await expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('getRegistryLayerStream > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
    })
    const response = getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    await expect(response).rejects.toThrowError('Unrecognised response returned by the registry.')
  })

  test('getRegistryLayerStream > malformed response', async () => {
    const mockStream = { read: null, _read: null, pipe: null }
    fetchMock.mockReturnValueOnce({
      ok: true,
      body: mockStream,
    })

    const response = getRegistryLayerStream('token', { namespace: 'modelId', image: 'image' }, 'sha256:digest1')

    await expect(response).rejects.toThrowError('Unrecognised response stream when getting image layer blob.')
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

    await expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('listModelRepos > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
    })
    const response = listModelRepos('token', 'modelId')

    await expect(response).rejects.toThrowError('Unrecognised response returned by the registry.')
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

    await expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('listModelRepos > malformed response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => 'wrong'),
    })
    const response = listModelRepos('token', 'modelId')

    await expect(response).rejects.toThrowError('Unrecognised response body when listing model repositories.')
  })

  test('listModelRepos > missing repositories in response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ fake: 'info' })),
    })
    const response = listModelRepos('token', 'modelId')

    await expect(response).rejects.toThrowError('Unrecognised response body when listing model repositories.')
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

    await expect(response).rejects.toThrowError('Unrecognised response body when listing image tags.')
  })

  test('listImageTags > missing repositories in response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ fake: 'info' })),
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    await expect(response).rejects.toThrowError('Unrecognised response body when listing image tags.')
  })

  test('listImageTags > unknown name return empty list', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      json: vi.fn(() => ({
        errors: [
          {
            code: 'NAME_UNKNOWN',
            message: 'repository name not known to registry',
            detail: [],
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
            detail: [],
          },
        ],
      })),
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    await expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('doesLayerExist > success true', async () => {
    const mockHeaders = new Headers({
      'accept-ranges': 'string',
      'content-length': 'string',
      'content-type': 'string',
      date: 'string',
      'docker-content-digest': 'string',
      'docker-distribution-api-version': 'string',
      etag: 'string',
    })
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: mockHeaders,
    })

    const response = await doesLayerExist('token', { namespace: 'modelId', image: 'image' }, 'digest')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(true)
  })

  test('doesLayerExist > success false', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      status: 404,
      statusText: '',
    })

    const response = await doesLayerExist('token', { namespace: 'modelId', image: 'image' }, 'digest')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(false)
  })

  test('doesLayerExist > malformed response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: new Headers({}),
    })

    const response = doesLayerExist('token', { namespace: 'modelId', image: 'image' }, 'digest')

    await expect(response).rejects.toThrowError('Unrecognised response headers when heading image layer.')
  })

  test('initialiseUpload > success', async () => {
    const mockHeaders = new Headers({
      'content-length': 'string',
      date: 'string',
      'docker-distribution-api-version': 'string',
      'docker-upload-uuid': 'string',
      location: 'string',
      range: 'string',
    })
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: mockHeaders,
    })

    const response = await initialiseUpload('token', { namespace: 'modelId', image: 'image' })

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(Object.fromEntries(mockHeaders))
  })

  test('initialiseUpload > malformed response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: new Headers({}),
    })

    const response = initialiseUpload('token', { namespace: 'modelId', image: 'image' })

    await expect(response).rejects.toThrowError('Unrecognised response headers when posting initialise image upload.')
  })

  test('putManifest > success', async () => {
    const mockHeaders = new Headers({
      'content-length': 'string',
      date: 'string',
      'docker-content-digest': 'string',
      'docker-distribution-api-version': 'string',
      location: 'string',
    })
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: mockHeaders,
    })

    const response = await putManifest('token', { namespace: 'modelId', image: 'image' }, 'tag', null, '')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(Object.fromEntries(mockHeaders))
  })

  test('putManifest > malformed response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: new Headers({}),
    })

    const response = putManifest('token', { namespace: 'modelId', image: 'image' }, 'tag', null, '')

    await expect(response).rejects.toThrowError('Unrecognised response headers when putting image manifest.')
  })

  test('uploadLayerMonolithic > success', async () => {
    const mockHeaders = new Headers({
      'content-length': 'string',
      date: 'string',
      'docker-content-digest': 'string',
      'docker-distribution-api-version': 'string',
      location: 'string',
    })
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: mockHeaders,
    })

    const response = await uploadLayerMonolithic('token', 'url', 'digest', new Readable(), 'size')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(Object.fromEntries(mockHeaders))
  })

  test('uploadLayerMonolithic > malformed response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: new Headers({}),
    })

    const response = uploadLayerMonolithic('token', 'url', 'digest', new Readable(), 'size')

    await expect(response).rejects.toThrowError('Unrecognised response headers when putting image manifest.')
  })
})
