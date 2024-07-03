import { describe, expect, test, vi } from 'vitest'

import { createInferenceService, updateInferenceService } from '../../src/clients/inferencing.js'

const configMock = vi.hoisted(() => ({
  ui: {
    inference: {
      enabled: true,
      connection: {
        host: 'http://example.com',
      },
    },
  },
  inference: {
    authorisationToken: 'test',
  },
}))

vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(() => ({ ok: true, text: vi.fn(), json: vi.fn() })),
}))
vi.mock('node-fetch', async () => fetchMock)

describe('clients > inferencing', () => {
  test('createInferencing > success', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ message: 'ok' })),
    })
    const response = await createInferenceService({} as any)

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual({ message: 'ok' })
  })

  test('createInferencing > bad response', async () => {
    fetchMock.default.mockResolvedValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
    })
    expect(() => createInferenceService({} as any)).rejects.toThrowError(
      /^Unrecognised response returned by the inferencing service./,
    )
  })

  test('createInferencing > rejected', async () => {
    fetchMock.default.mockRejectedValueOnce('Unable to communicate with the inferencing service.')

    expect(() => createInferenceService({} as any)).rejects.toThrowError(
      /^Unable to communicate with the inferencing service./,
    )
  })

  test('createInferencing > no authorization token', async () => {
    vi.spyOn(configMock, 'inference', 'get').mockReturnValueOnce({ authorisationToken: '' })

    expect(() => updateInferenceService({} as any)).rejects.toThrowError(/^No authentication key exists./)
  })

  test('updateInferencing > success', async () => {
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ message: 'ok' })),
    })
    const response = await updateInferenceService({} as any)

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual({ message: 'ok' })
  })

  test('updateInferencing > bad response', async () => {
    fetchMock.default.mockResolvedValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
    })
    expect(() => updateInferenceService({} as any)).rejects.toThrowError(
      /^Unrecognised response returned by the inferencing service./,
    )
  })

  test('updateInferencing > rejected', async () => {
    fetchMock.default.mockRejectedValueOnce('Unable to communicate with the inferencing service.')

    expect(() => updateInferenceService({} as any)).rejects.toThrowError(
      /^Unable to communicate with the inferencing service./,
    )
  })

  test('updateInferencing > no authorization token', async () => {
    vi.spyOn(configMock, 'inference', 'get').mockReturnValueOnce({ authorisationToken: '' })

    expect(() => updateInferenceService({} as any)).rejects.toThrowError(/^No authentication key exists./)
  })
})
