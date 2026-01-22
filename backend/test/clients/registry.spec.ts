import { Readable } from 'node:stream'

import { beforeEach, describe, expect, Mock, test, vi } from 'vitest'

import {
  deleteManifest,
  doesLayerExist,
  getApiVersion,
  getImageTagManifest,
  getRegistryLayerStream,
  initialiseUpload,
  listImageTags,
  listModelRepos,
  mountBlob,
  putManifest,
  uploadLayerMonolithic,
} from '../../src/clients/registry.js'
import { DockerManifestMediaType, OCIEmptyMediaType, OCIManifestMediaType } from '../../src/utils/registryResponses.js'

const mockHttpService = vi.hoisted(() => {
  return {
    getHttpsAgent: vi.fn(() => 'mock agent'),
    getHttpsUndiciAgent: vi.fn(() => 'mock agent'),
  }
})
vi.mock('../../src/services/http.js', () => mockHttpService)

const mockReadable = vi.fn() as unknown as Readable
const mockedFetchBodyStream = new Readable()
const fetchMockResponse = new Response(mockedFetchBodyStream, {
  status: 200,
  statusText: 'ok',
  headers: new Headers({ 'content-type': 'application/json' }),
})
global.fetch = vi.fn()
// workaround TS being difficult
const fetchMock: Mock = global.fetch as Mock

class AbortControllerMock {
  signal: { aborted: boolean; onabort: ((...args: any[]) => void) | null }
  constructor() {
    this.signal = {
      aborted: false,
      onabort: null,
    }
  }
  abort() {
    this.signal.aborted = true
    if (typeof this.signal.onabort === 'function') {
      this.signal.onabort()
    }
  }
}
global.AbortController = AbortControllerMock as any

describe('clients > registry', () => {
  beforeEach(() => {
    // globals (e.g. `fetch`) persist changes between tests so always reset to the default mock
    fetchMock.mockResolvedValue(fetchMockResponse)
  })

  test('getApiVersion > success', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      body: {},
      json: vi.fn(() => ({})),
      headers: new Headers({ 'content-type': 'application/json', 'docker-distribution-api-version': 'registry/2.0' }),
    })

    const response = await getApiVersion('token')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual('registry/2.0')
  })

  test('getApiVersion > bad version', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      body: {},
      json: vi.fn(() => ({})),
      headers: new Headers({ 'content-type': 'application/json', 'docker-distribution-api-version': 'registry/1.0' }),
    })

    const response = getApiVersion('token')

    await expect(response).rejects.toThrowError('Registry returned invalid headers.')
    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
  })

  test('getImageTagManifest > success Docker spec', async () => {
    const mockManifest = {
      schemaVersion: 2,
      mediaType: DockerManifestMediaType,
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
      headers: new Headers({ 'content-type': 'application/json', 'docker-content-digest': 'digest' }),
    })

    const response = await getImageTagManifest('token', { repository: 'modelId', name: 'image', tag: 'tag1' })

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual({
      body: mockManifest,
      headers: { 'content-type': 'application/json', 'docker-content-digest': 'digest' },
    })
  })

  test.each([
    {
      schemaVersion: 2,
      mediaType: OCIManifestMediaType,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        size: 1,
        digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          size: 1,
          digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        },
      ],
    },
    {
      schemaVersion: 2,
      mediaType: OCIEmptyMediaType,
      artifactType: OCIManifestMediaType,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        size: 1,
        digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        urls: ['https://github.com/gchq/Bailo', 'https://gchq.github.io/Bailo'],
        annotations: {},
        data: '{}',
        artifactType: 'application/vnd.oci.image.config.v1+json',
      },
      layers: [
        {
          mediaType: 'application/vnd.oci.image.layer.v1.tar',
          size: 1,
          digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        },
        {
          mediaType: 'application/vnd.oci.empty.v1+json',
          digest: 'sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a',
          size: 2,
          data: 'e30=',
        },
      ],
      subject: {
        mediaType: 'application/vnd.oci.image.manifest.v1+json',
        digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        size: 1,
      },
      annotations: {
        'com.example.key1': 'value1',
        'com.example.key2': 'value2',
      },
    },
  ])('getImageTagManifest > success OCI spec', async (mockManifest) => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => mockManifest),
      headers: new Headers({ 'content-type': 'application/json', 'docker-content-digest': 'digest' }),
    })

    const response = await getImageTagManifest('token', { repository: 'modelId', name: 'image', tag: 'tag1' })

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual({
      body: mockManifest,
      headers: { 'content-type': 'application/json', 'docker-content-digest': 'digest' },
    })
  })

  test('getImageTagManifest > cannot reach registry', async () => {
    fetchMock.mockRejectedValueOnce('Error')
    const response = getImageTagManifest('token', { repository: 'modelId', name: 'image', tag: 'tag1' })

    await expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('getImageTagManifest > invalid headers response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      headers: new Headers({}),
    })
    const response = getImageTagManifest('token', { repository: 'modelId', name: 'image', tag: 'tag1' })

    await expect(response).rejects.toThrowError('Registry returned invalid headers.')
  })

  test('getImageTagManifest > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
      headers: new Headers({ 'content-type': 'application/json', 'docker-content-digest': 'digest' }),
    })
    const response = getImageTagManifest('token', { repository: 'modelId', name: 'image', tag: 'tag1' })

    await expect(response).rejects.toThrowError('Unrecognised registry error response.')
  })

  test('getImageTagManifest > registry error response', async () => {
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
      headers: new Headers({ 'content-type': 'application/json', 'docker-content-digest': 'digest' }),
    })
    const response = getImageTagManifest('token', { repository: 'modelId', name: 'image', tag: 'tag1' })

    await expect(response).rejects.toThrowError('Error response received from registry.')
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
      headers: new Headers({ 'content-type': 'application/json', 'docker-content-digest': 'digest' }),
    })

    const response = getImageTagManifest('token', { repository: 'modelId', name: 'image', tag: 'tag1' })

    await expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('getRegistryLayerStream > success', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json', 'docker-content-digest': 'digest' }),
      body: mockedFetchBodyStream,
    })

    const response = await getRegistryLayerStream('token', { repository: 'modelId', name: 'image' }, 'sha256:digest1')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response.stream).toBeInstanceOf(Readable)
    expect(response.abort).toBeTypeOf('function')
  })

  test('getRegistryLayerStream > cannot reach registry', async () => {
    fetchMock.mockRejectedValueOnce('Error')
    const response = getRegistryLayerStream('token', { repository: 'modelId', name: 'image' }, 'sha256:digest1')

    await expect(response).rejects.toThrowError('Unable to communicate with the registry.')
  })

  test('getRegistryLayerStream > unrecognised error response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      headers: new Headers({ 'content-type': 'application/json', 'docker-content-digest': 'digest' }),
    })
    const response = getRegistryLayerStream('token', { repository: 'modelId', name: 'image' }, 'sha256:digest1')

    await expect(response).rejects.toThrowError('Unrecognised registry error response.')
  })

  test('getRegistryLayerStream > malformed response', async () => {
    const mockStream = { read: null, _read: null, pipe: null }
    fetchMock.mockReturnValueOnce({
      ok: true,
      body: mockStream,
      headers: new Headers({ 'content-type': 'application/json', 'docker-content-digest': 'digest' }),
    })

    const response = getRegistryLayerStream('token', { repository: 'modelId', name: 'image' }, 'sha256:digest1')

    await expect(response).rejects.toThrowError('Unrecognised response stream when getting image layer blob.')
  })

  test('listModelRepos > only returns model repos', async () => {
    const modelId = 'modelId'
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ repositories: [`${modelId}/repo`, 'wrong/repo'] })),
      headers: new Headers({ 'content-type': 'application/json' }),
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
      json: vi.fn(() => ({
        errors: [
          {
            code: 'NAME_UNKNOWN',
            message: 'repository name not known to registry',
            detail: [Object],
          },
        ],
      })),
      headers: new Headers({ 'content-type': 'application/json' }),
    })
    const response = listModelRepos('token', 'modelId')

    await expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('listModelRepos > missing repositories in response', async () => {
    fetchMock.mockReturnValueOnce({
      ok: true,
      json: vi.fn(() => ({ fake: 'info' })),
      headers: new Headers({ 'content-type': 'application/json' }),
    })
    const response = listModelRepos('token', 'modelId')

    await expect(response).rejects.toThrowError('Registry response body validation failed.')
  })

  test('listModelRepos > paginated link sets paginateParameter', async () => {
    const modelId = 'modelId'
    const linkHeader = '</v2/_catalog?n=100&last=modelId>; rel="next"'
    fetchMock
      .mockReturnValueOnce({
        ok: true,
        json: vi.fn(() => ({ repositories: [`${modelId}/repo`] })),
        headers: new Headers({ 'content-type': 'application/json', link: linkHeader }),
      })
      .mockReturnValueOnce({
        ok: true,
        json: vi.fn(() => ({ repositories: [`${modelId}/repo`, 'wrong/repo'] })),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
    const response = await listModelRepos('token', modelId)

    expect(response).toStrictEqual([`${modelId}/repo`, `${modelId}/repo`])
  })

  test('listImageTags > success', async () => {
    const tags = ['tag1', 'tag2']
    const mockBody = { name: 'name', tags }
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      body: mockBody,
      json: vi.fn(() => mockBody),
    })

    const response = await listImageTags('token', { repository: 'modelId', name: 'image' })

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(tags)
  })

  test('listImageTags > success multiple pages', async () => {
    const tags = ['tag1', 'tag2']
    const mockBody = { name: 'name', tags }
    fetchMock
      .mockReturnValueOnce({
        ok: true,
        headers: new Headers({
          'content-type': 'application/json',
          link: '<http://example.com/v2/_catalog?n=20&last=b>; rel="next"',
        }),
        body: mockBody,
        json: vi.fn(() => mockBody),
      })
      .mockReturnValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        body: { name: 'name', tags: ['tag3'] },
        json: vi.fn(() => ({
          name: 'name',
          tags: ['tag3'],
        })),
      })

    const response = await listImageTags('token', { repository: 'modelId', name: 'image' })

    expect(fetchMock).toBeCalledTimes(2)
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(['tag1', 'tag2', 'tag3'])
  })

  test('listImageTags > registry pagination limit', async () => {
    const mockBody = { name: 'name', tags: [] }
    fetchMock.mockReturnValue({
      ok: true,
      headers: new Headers({
        'content-type': 'application/json',
        link: '<http://example.com/v2/_catalog?n=20&last=b>; rel="next"',
      }),
      body: mockBody,
      json: vi.fn(() => mockBody),
    })

    const response = listImageTags('token', { repository: 'modelId', name: 'image' })

    await expect(response).rejects.toThrowError('Registry pagination limit exceeded.')
    expect(fetchMock).toBeCalledTimes(100)
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
      headers: new Headers({ 'content-type': 'application/json' }),
    })

    const response = await listImageTags('token', { repository: 'modelId', name: 'image' })

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
      headers: new Headers({ 'content-type': 'application/json' }),
    })

    const response = listImageTags('token', { repository: 'modelId', name: 'image' })

    await expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('doesLayerExist > success true', async () => {
    const mockHeaders = new Headers({
      'accept-ranges': 'string',
      'content-length': 'string',
      'content-type': 'json',
      date: 'string',
      'docker-content-digest': 'string',
      'docker-distribution-api-version': 'string',
      etag: 'string',
    })
    fetchMock.mockReturnValueOnce({
      ok: true,
      headers: mockHeaders,
    })

    const response = await doesLayerExist('token', { repository: 'modelId', name: 'image' }, 'digest')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(true)
  })

  test('doesLayerExist > success false', async () => {
    fetchMock.mockReturnValueOnce({
      ok: false,
      status: 404,
      statusText: '',
      headers: new Headers({}),
    })

    const response = await doesLayerExist('token', { repository: 'modelId', name: 'image' }, 'digest')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(false)
  })

  test('doesLayerExist > rethrow error', async () => {
    fetchMock.mockRejectedValueOnce('Error')

    const response = doesLayerExist('token', { repository: 'modelId', name: 'image' }, 'digest')

    await expect(response).rejects.toThrowError('Unable to communicate with the registry.')
    expect(fetchMock).toBeCalled()
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

    const response = await initialiseUpload('token', { repository: 'modelId', name: 'image' })

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(Object.fromEntries(mockHeaders))
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

    const response = await putManifest('token', { repository: 'modelId', name: 'image', tag: 'tag' }, null, '')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(Object.fromEntries(mockHeaders))
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

    const response = await uploadLayerMonolithic('token', 'url', 'digest', mockReadable, 'size')

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(Object.fromEntries(mockHeaders))
  })

  test('mountBlob > success', async () => {
    const mockHeaders = new Headers({
      'content-length': 'string',
      date: 'string',
      'docker-content-digest': 'string',
      'docker-distribution-api-version': 'string',
      location: 'string',
    })
    fetchMock.mockReturnValueOnce({
      text: vi.fn(),
      ok: true,
      headers: mockHeaders,
    })

    const response = await mountBlob(
      'token',
      { repository: 'modelId', name: 'image' },
      { repository: 'modelId', name: 'image' },
      'blob',
    )

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(Object.fromEntries(mockHeaders))
  })

  test('deleteManifest > success', async () => {
    const mockHeaders = new Headers({
      'content-length': 'string',
      date: 'string',
      'docker-distribution-api-version': 'string',
    })
    fetchMock.mockReturnValueOnce({
      text: vi.fn(),
      ok: true,
      headers: mockHeaders,
    })

    const response = await deleteManifest('token', { repository: 'modelId', name: 'image', tag: 'tag' })

    expect(fetchMock).toBeCalled()
    expect(fetchMock.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(Object.fromEntries(mockHeaders))
  })
})
