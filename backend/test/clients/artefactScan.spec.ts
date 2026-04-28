import { Readable } from 'node:stream'

import { beforeEach, describe, expect, test, vi } from 'vitest'

const configMock = vi.hoisted(() => ({
  artefactScanning: {
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

const expectedInfoResponse = {
  apiName: 'Bailo ArtefactScan API',
  apiVersion: '4.0.0',
  modelscanScannerName: 'modelscan',
  modelscanVersion: '0.8.8',
  trivyScannerName: 'trivy',
  trivyVersion: '0.69.1',
}

async function loadClient() {
  return await import('../../src/clients/artefactScan.js')
}

describe('clients > artefactScan', () => {
  beforeEach(() => {
    // required due to cached `getCachedArtefactScanInfo` function
    vi.resetModules()
  })

  test('getCachedArtefactScanInfo > success', async () => {
    const { getCachedArtefactScanInfo } = await loadClient()
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(function () {
        return expectedInfoResponse
      }),
    })
    const response = await getCachedArtefactScanInfo()

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(expectedInfoResponse)
  })

  test('getCachedArtefactScanInfo > uses cached value within TTL', async () => {
    const { getCachedArtefactScanInfo } = await loadClient()

    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => expectedInfoResponse),
    })

    const first = await getCachedArtefactScanInfo()
    const second = await getCachedArtefactScanInfo()

    expect(first).toStrictEqual(expectedInfoResponse)
    expect(second).toStrictEqual(expectedInfoResponse)
    expect(fetchMock.default).toHaveBeenCalledTimes(1)
  })

  test('getCachedArtefactScanInfo > inFlight prevents duplicate fetches', async () => {
    let resolveJson: (v: any) => void
    const jsonPromise = new Promise((resolve) => {
      resolveJson = resolve
    })
    fetchMock.default.mockResolvedValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => jsonPromise),
    })

    const { getCachedArtefactScanInfo } = await loadClient()

    const p1 = getCachedArtefactScanInfo()
    const p2 = getCachedArtefactScanInfo()

    expect(fetchMock.default).toHaveBeenCalledOnce()

    resolveJson!(expectedInfoResponse)

    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1).toStrictEqual(expectedInfoResponse)
    expect(r2).toStrictEqual(expectedInfoResponse)
  })

  test('getCachedArtefactScanInfo > refreshes cache after TTL expiry', async () => {
    const { getCachedArtefactScanInfo } = await loadClient()

    const response1 = {
      apiName: 'API',
      apiVersion: '1',
      modelscanScannerName: 'modelscan',
      modelscanVersion: '1',
      trivyScannerName: 'trivy',
      trivyVersion: '1',
    }

    const response2 = {
      apiName: 'API',
      apiVersion: '2',
      modelscanScannerName: 'modelscan',
      modelscanVersion: '2',
      trivyScannerName: 'trivy',
      trivyVersion: '2',
    }

    fetchMock.default
      .mockReturnValueOnce({
        ok: true,
        text: vi.fn(),
        json: vi.fn(() => response1),
      })
      .mockReturnValueOnce({
        ok: true,
        text: vi.fn(),
        json: vi.fn(() => response2),
      })

    vi.setSystemTime(new Date(0))
    const first = await getCachedArtefactScanInfo()

    // advance time beyond 5 min TTL
    vi.setSystemTime(new Date(6 * 60 * 1000))
    const second = await getCachedArtefactScanInfo()

    expect(first).toStrictEqual(response1)
    expect(second).toStrictEqual(response2)
    expect(fetchMock.default).toHaveBeenCalledTimes(2)
  })

  test('getCachedArtefactScanInfo > bad response', async () => {
    const { getCachedArtefactScanInfo } = await loadClient()
    fetchMock.default.mockResolvedValueOnce({
      ok: false,
      text: vi.fn(function () {
        return 'Unrecognised response'
      }),
      json: vi.fn(),
    })

    await expect(() => getCachedArtefactScanInfo()).rejects.toThrowError(
      /^Unrecognised response returned by the ArtefactScan service./,
    )
  })

  test('getCachedArtefactScanInfo > rejected', async () => {
    const { getCachedArtefactScanInfo } = await loadClient()
    fetchMock.default.mockRejectedValueOnce('Unable to communicate with the inferencing service.')

    await expect(() => getCachedArtefactScanInfo()).rejects.toThrowError(
      /^Unable to communicate with the ArtefactScan service./,
    )
  })

  test('scanFileStream > success', async () => {
    const { scanFileStream } = await loadClient()
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

    const response = await scanFileStream({} as Readable, 'safe_model.h5')

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls).toMatchSnapshot()
    expect(formDataMock.default).toBeCalled()
    expect(formDataMock.default.mock.calls).toMatchSnapshot()
    expect(response).toStrictEqual(expectedResponse)
  })

  test('scanFileStream > invalid response fails schema validation', async () => {
    const { scanFileStream } = await loadClient()

    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => ({ invalid: 'payload' })),
    })

    await expect(() => scanFileStream({} as Readable, 'file.bin')).rejects.toThrow()
  })

  test('scanFileStream > bad response', async () => {
    const { scanFileStream } = await loadClient()
    fetchMock.default.mockResolvedValueOnce({
      ok: false,
      text: vi.fn(function () {
        return 'Unrecognised response'
      }),
      json: vi.fn(),
    })

    await expect(() => scanFileStream({} as Readable, 'safe_model.h5')).rejects.toThrowError(
      /^Unrecognised response returned by the ArtefactScan service./,
    )
  })

  test('scanFileStream > rejected', async () => {
    const { scanFileStream } = await loadClient()
    fetchMock.default.mockRejectedValueOnce('Unable to communicate with the ArtefactScan service.')

    // use a real Readable to make sure `.destroy()` is also called
    await expect(() => scanFileStream(Readable.from(''), 'safe_model.h5')).rejects.toThrowError(
      /^Unable to communicate with the ArtefactScan service./,
    )
  })

  test('scanImageBlobStream > success', async () => {
    const { scanImageBlobStream } = await loadClient()

    const expectedResponse = {
      SchemaVersion: 2,
      CreatedAt: '2024-11-27T12:00:00Z',
      ArtifactName: 'sha256:abc',
      ArtifactType: 'container_image',
      Metadata: {
        OS: { Family: 'debian', Name: '12' },
      },
      Results: [],
    }

    fetchMock.default.mockReturnValueOnce({
      ok: true,
      text: vi.fn(),
      json: vi.fn(() => expectedResponse),
    })

    const response = await scanImageBlobStream({} as Readable, 'sha256:abc')

    expect(fetchMock.default).toBeCalled()
    expect(formDataMock.default).toBeCalled()
    expect(response).toStrictEqual(expectedResponse)
  })

  test('scanImageBlobStream > bad response', async () => {
    const { scanImageBlobStream } = await loadClient()

    fetchMock.default.mockResolvedValueOnce({
      ok: false,
      text: vi.fn(() => 'Bad response'),
      json: vi.fn(),
    })

    await expect(() => scanImageBlobStream({} as Readable, 'sha256:abc')).rejects.toThrowError(
      /^Unrecognised response returned by the ArtefactScan service./,
    )
  })

  test('scanImageBlobStream > rejected fetch destroys stream', async () => {
    const { scanImageBlobStream } = await loadClient()

    fetchMock.default.mockRejectedValueOnce(new Error('network error'))

    const stream = Readable.from('data')
    const destroySpy = vi.spyOn(stream, 'destroy')

    await expect(() => scanImageBlobStream(stream, 'sha256:abc')).rejects.toThrowError(
      /^Unable to communicate with the ArtefactScan service./,
    )

    expect(destroySpy).toBeCalled()
  })
})
