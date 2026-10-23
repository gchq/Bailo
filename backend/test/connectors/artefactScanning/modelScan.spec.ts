import { Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import { ArtefactScanState } from '../../../src/connectors/artefactScanning/Base.js'
import { ModelScanFileScanningConnector } from '../../../src/connectors/artefactScanning/modelScan.js'
import { ArtefactKind } from '../../../src/models/Scan.js'

vi.mock('../../../src/clients/artefactScan.js')
vi.mock('../../../src/clients/s3.js')
vi.mock('../../../src/clients/registry.js')
vi.mock('../../../src/services/log.js')

const artefactScanClientMocks = vi.hoisted(() => ({
  getCachedArtefactScanInfo: vi.fn(),
  scanFileStream: vi.fn(),
}))
vi.mock('../../../src/clients/artefactScan.js', () => artefactScanClientMocks)

const s3Mocks = vi.hoisted(() => ({
  getObjectStream: vi.fn(),
}))
vi.mock('../../../src/clients/s3.js', () => s3Mocks)

const authMocks = vi.hoisted(() => ({
  issueAccessToken: vi.fn(),
}))
vi.mock('../../../src/routes/v1/registryAuth.js', () => authMocks)

const pendingJobs: Promise<any>[] = []
const exportQueueMock = vi.hoisted(() => {
  const exportQueueAddMock = vi.fn(function (job: () => Promise<any>) {
    const p = job()
    pendingJobs.push(p)
    return p
  })
  return {
    add: exportQueueAddMock,
    exportQueueAddMock,
  }
})
vi.mock('p-queue', () => ({
  default: vi.fn(function () {
    return exportQueueMock
  }),
}))

describe('connectors > artefactScanning > modelScan > ModelScanFileScanningConnector', () => {
  test('scan() success', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      modelscanVersion: '1.0.0',
    })
    s3Mocks.getObjectStream.mockResolvedValueOnce(Readable.from('file'))
    artefactScanClientMocks.scanFileStream.mockResolvedValueOnce({
      issues: [
        {
          severity: 'HIGH',
          description: 'Test issue',
          scanner: 'modelscan',
        },
      ],
      errors: [],
      summary: { skipped: { total_skipped: 0 } },
    })
    const connector = new ModelScanFileScanningConnector()
    await connector.init()

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Complete)
    expect(result.summary).toHaveLength(1)
    expect(result.artefactKind).toBe(ArtefactKind.FILE)
  })

  test('scan() passes basename to scanFileStream for path-like filenames', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      modelscanVersion: '1.0.0',
    })
    s3Mocks.getObjectStream.mockResolvedValueOnce(Readable.from('file'))
    artefactScanClientMocks.scanFileStream.mockResolvedValueOnce({
      issues: [],
      errors: [],
      summary: { skipped: { total_skipped: 0 } },
    })
    const connector = new ModelScanFileScanningConnector()
    await connector.init()

    await connector.scan({
      id: 'file1',
      name: 'weights/subdir/model.bin',
      path: '/bucket/file1',
    } as any)

    expect(artefactScanClientMocks.scanFileStream).toHaveBeenCalledWith(expect.anything(), 'model.bin')
  })

  test('scan() returns found errors', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      modelscanVersion: '1.0.0',
    })
    s3Mocks.getObjectStream.mockResolvedValueOnce(Readable.from('file'))
    artefactScanClientMocks.scanFileStream.mockResolvedValueOnce({
      issues: [],
      errors: [{ description: 'failure' }],
    })
    const connector = new ModelScanFileScanningConnector()
    await connector.init()

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
  })

  test('scan() handles thrown error', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      modelscanVersion: '1.0.0',
    })
    const stream = Readable.from('file')
    const destroySpy = vi.spyOn(stream, 'destroy')
    s3Mocks.getObjectStream.mockResolvedValueOnce(stream)
    artefactScanClientMocks.scanFileStream.mockRejectedValueOnce(new Error('boom'))
    const connector = new ModelScanFileScanningConnector()
    await connector.init()

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(destroySpy).toHaveBeenCalled()
  })

  test('scan() returns error when version is undefined', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({})
    const connector = new ModelScanFileScanningConnector()
    await connector.init()
    // @ts-expect-ignore accessing protected property
    connector['version'] = undefined

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(result.toolName).toBe('ModelScan')
    expect(result.scannerVersion).toBeUndefined()
  })

  test('scan() skips too large file', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      modelscanVersion: '1.0.0',
      modelscanSupportedExtensions: ['.bin'],
      maxFileSizeBytes: 1,
    })
    const connector = new ModelScanFileScanningConnector()
    await connector.init()

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
      size: 2,
    } as any)

    expect(result).toMatchObject({
      toolName: 'ModelScan',
      scannerVersion: '1.0.0',
      artefactKind: ArtefactKind.FILE,
      summary: ['Artefact exceeds configured scanner size limit.'],
      state: ArtefactScanState.Error,
    })
    expect(result.lastRunAt).toBeInstanceOf(Date)
    expect(result.toolName).toBe('ModelScan')
  })

  test('scan() skips unsupported extension', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      modelscanVersion: '1.0.0',
      modelscanSupportedExtensions: ['.txt', '.pdf'],
    })
    const connector = new ModelScanFileScanningConnector()
    await connector.init()

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result).toMatchObject({
      toolName: 'ModelScan',
      scannerVersion: '1.0.0',
      artefactKind: ArtefactKind.FILE,
      summary: ['File type is not compatible with this scanner.'],
      state: ArtefactScanState.Skipped,
    })
    expect(result.lastRunAt).toBeInstanceOf(Date)
  })
})
