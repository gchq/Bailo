import { describe, expect, test, vi } from 'vitest'

import { getModelScanInfo, scanFile } from '../../src/clients/modelScan.js'

const configMock = vi.hoisted(() => ({
  avScanning: {
    modelscan: {
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
  default: vi.fn(() => ({ ok: true, text: vi.fn(), json: vi.fn() })),
}))
vi.mock('node-fetch', async () => fetchMock)

describe('clients > modelScan', () => {
  test('getModelScanInfo > success', async () => {
    const expectedResponse = {
      apiName: 'Bailo ModelScan API',
      apiVersion: '1.0.0',
      scannerName: 'modelscan',
      modelscanVersion: '0.8.1',
    }
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => expectedResponse),
    })
    const response = await getModelScanInfo()

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(expectedResponse)
  })

  test('getModelScanInfo > bad response', async () => {
    fetchMock.default.mockResolvedValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
    })

    expect(() => getModelScanInfo()).rejects.toThrowError(/^Unrecognised response returned by the ModelScan service./)
  })

  test('getModelScanInfo > rejected', async () => {
    fetchMock.default.mockRejectedValueOnce('Unable to communicate with the inferencing service.')

    expect(() => getModelScanInfo()).rejects.toThrowError(/^Unable to communicate with the ModelScan service./)
  })

  test('scanFile > success', async () => {
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
      json: vi.fn(() => expectedResponse),
    })
    const response = await scanFile(new Blob([''], { type: 'application/x-hdf5' }), 'safe_model.h5')

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(expectedResponse)
  })

  test('scanFile > bad response', async () => {
    fetchMock.default.mockResolvedValueOnce({
      ok: false,
      text: vi.fn(() => 'Unrecognised response'),
      json: vi.fn(),
    })
    expect(() => scanFile(new Blob([''], { type: 'application/x-hdf5' }), 'safe_model.h5')).rejects.toThrowError(
      /^Unrecognised response returned by the ModelScan service./,
    )
  })

  test('scanFile > rejected', async () => {
    fetchMock.default.mockRejectedValueOnce('Unable to communicate with the inferencing service.')

    expect(() => scanFile(new Blob([''], { type: 'application/x-hdf5' }), 'safe_model.h5')).rejects.toThrowError(
      /^Unable to communicate with the ModelScan service./,
    )
  })
})
