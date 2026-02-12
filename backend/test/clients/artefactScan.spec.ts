import { Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import { getArtefactScanInfo, scanStream } from '../../src/clients/artefactScan.js'

const configMock = vi.hoisted(() => ({
  avScanning: {
    artefactscan: {
      enabled: true,
      connection: {
        host: 'example.com',
      },
    },
  },
}))

vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(function () {
    return {
      ok: true,
      text: vi.fn(),
      json: vi.fn(),
    }
  }),
}))
vi.mock('node-fetch', async () => fetchMock)

const formDataMock = vi.hoisted(() => ({
  default: vi.fn(function () {
    return {
      append: vi.fn(),
      getHeaders: vi.fn(function () {}),
    }
  }),
}))
vi.mock('form-data', async () => formDataMock)

describe('clients > artefactScan', () => {
  test('getArtefactScanInfo > success', async () => {
    const expectedResponse = {
      apiName: 'Bailo ArtefactScan API',
      apiVersion: '1.0.0',
      scannerName: 'artefactscan',
      artefactscanVersion: '0.8.1',
    }
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(function () {
        return expectedResponse
      }),
    })
    const response = await getArtefactScanInfo()

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(expectedResponse)
  })

  test('getArtefactScanInfo > bad response', async () => {
    fetchMock.default.mockResolvedValueOnce({
      ok: false,
      text: vi.fn(function () {
        return 'Unrecognised response'
      }),
      json: vi.fn(),
    })

    await expect(() => getArtefactScanInfo()).rejects.toThrowError(
      /^Unrecognised response returned by the ArtefactScan service./,
    )
  })

  test('getArtefactScanInfo > rejected', async () => {
    fetchMock.default.mockRejectedValueOnce('Unable to communicate with the inferencing service.')

    await expect(() => getArtefactScanInfo()).rejects.toThrowError(
      /^Unable to communicate with the ArtefactScan service./,
    )
  })

  test('scanStream > success', async () => {
    const expectedResponse = {
      summary: {
        total_issues: 0,
        total_issues_by_severity: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
        },
        input_path: '/foo/bar/safe_model.h5',
        absolute_path: '/foo/bar',
        modelscan_version: '0.8.1',
        timestamp: '2024-11-27T12:00:00.000000',
        scanned: {
          total_scanned: 1,
          scanned_files: ['safe_model.h5'],
        },
        skipped: {
          total_skipped: 0,
          skipped_files: [],
        },
      },
      issues: [],
      errors: [],
    }
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(function () {
        return expectedResponse
      }),
    })
    // force lastModified to be 0
    const date = new Date(1970, 0, 1, 0)
    vi.setSystemTime(date)

    const response = await scanStream({} as Readable, 'safe_model.h5')

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(formDataMock.default).toBeCalled()
    expect(formDataMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(expectedResponse)
  })

  test('scanStream > bad response', async () => {
    fetchMock.default.mockResolvedValueOnce({
      ok: false,
      text: vi.fn(function () {
        return 'Unrecognised response'
      }),
      json: vi.fn(),
    })

    await expect(() => scanStream({} as Readable, 'safe_model.h5')).rejects.toThrowError(
      /^Unrecognised response returned by the ArtefactScan service./,
    )
  })

  test('scanStream > rejected', async () => {
    fetchMock.default.mockRejectedValueOnce('Unable to communicate with the ArtefactScan service.')

    // use a real Readable to make sure `.destroy()` is also called
    await expect(() => scanStream(Readable.from(''), 'safe_model.h5')).rejects.toThrowError(
      /^Unable to communicate with the ArtefactScan service./,
    )
  })
})
