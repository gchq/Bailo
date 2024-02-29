import { describe, expect, test, vi } from 'vitest'

import { listImageTags, listModelRepos } from '../../src/clients/registry.js'

const mockHttpService = vi.hoisted(() => {
  return {
    getHttpsAgent: vi.fn(() => 'mock agent'),
  }
})
vi.mock('../../src/services/v2/http.js', () => mockHttpService)

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(() => ({ ok: true, text: vi.fn(), json: vi.fn() })),
}))
vi.mock('node-fetch', async () => fetchMock)

describe('clients > registry', () => {
  test('listModelRepos > only returns model repos', async () => {
    const modelId = 'modelId'
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ repositories: [`${modelId}/repo`, 'wrong/repo'] })),
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
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Error response received from registry.')
  })

  test('listModelRepos > malformed response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => 'wrong'),
    })
    const response = listModelRepos('token', 'modelId')

    expect(response).rejects.toThrowError('Unrecognised response body when listing model repositories.')
  })

  test('listModelRepos > missing repositories in response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ fake: 'info' })),
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
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).rejects.toThrowError('Unrecognised response body when listing image tags.')
  })

  test('listImageTags > missing repositories in response', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ fake: 'info' })),
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
    })

    const response = listImageTags('token', { namespace: 'modelId', image: 'image' })

    expect(response).rejects.toThrowError('Error response received from registry.')
  })
})
