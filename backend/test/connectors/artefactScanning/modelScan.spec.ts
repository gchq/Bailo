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
    expect(destroySpy).toBeCalled()
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

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(result.toolName).toBe('ModelScan')
  })

  test('scan() skips unsupported extension', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      modelscanVersion: '1.0.0',
      modelscanSupportedExtensions: ['.txt'],
    })
    const connector = new ModelScanFileScanningConnector()
    await connector.init()

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Complete)
    expect(result.summary).toHaveLength(0)
    expect(result.artefactKind).toBe(ArtefactKind.FILE)
    expect(result.additionalInfo).toMatchObject(
      expect.objectContaining({
        summary: {
          total_issues: 0,
          total_issues_by_severity: {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            CRITICAL: 0,
          },
          input_path: '/tmp/model.bin',
          absolute_path: '/tmp',
          modelscan_version: '1.0.0',
          timestamp: expect.anything(),
          scanned: {
            total_scanned: 0,
          },
          skipped: {
            total_skipped: 1,
            skipped_files: [
              {
                category: 'SCAN_NOT_SUPPORTED',
                description: 'Model Scan did not scan file',
                source: 'model.bin',
              },
            ],
          },
        },
        issues: [],
        errors: [],
      }),
    )
  })
})
