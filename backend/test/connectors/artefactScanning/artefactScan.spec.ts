import { Readable } from 'node:stream'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  ModelScanFileScanningConnector,
  TrivyImageScanningConnector,
} from '../../../src/connectors/artefactScanning/artefactScan.js'
import { ArtefactScanState } from '../../../src/connectors/artefactScanning/Base.js'
import { ArtefactKind } from '../../../src/models/Scan.js'

vi.mock('../../../src/clients/artefactScan.js')
vi.mock('../../../src/clients/s3.js')
vi.mock('../../../src/clients/registry.js')
vi.mock('../../../src/routes/v1/registryAuth.js')
vi.mock('../../../src/services/log.js')

const artefactScanClientMocks = vi.hoisted(() => ({
  getCachedArtefactScanInfo: vi.fn(),
  scanFileStream: vi.fn(),
  scanImageBlobStream: vi.fn(),
}))
vi.mock('../../../src/clients/artefactScan.js', () => artefactScanClientMocks)

const s3Mocks = vi.hoisted(() => ({
  getObjectStream: vi.fn(),
}))
vi.mock('../../../src/clients/s3.js', () => s3Mocks)

const registryMocks = vi.hoisted(() => ({
  getRegistryLayerStream: vi.fn(),
}))
vi.mock('../../../src/clients/registry.js', () => registryMocks)

const authMocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
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

describe('connectors > artefactScanning > artefactScan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('ModelScanFileScanningConnector > successful file scan', async () => {
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

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Complete)
    expect(result.summary).toHaveLength(1)
    expect(result.artefactKind).toBe(ArtefactKind.FILE)
  })

  test('ModelScanFileScanningConnector > scan returns errors', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      modelscanVersion: '1.0.0',
    })
    s3Mocks.getObjectStream.mockResolvedValueOnce(Readable.from('file'))
    artefactScanClientMocks.scanFileStream.mockResolvedValueOnce({
      issues: [],
      errors: [{ description: 'failure' }],
    })
    const connector = new ModelScanFileScanningConnector()

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
  })

  test('ModelScanFileScanningConnector > scan throws', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      modelscanVersion: '1.0.0',
    })
    const stream = Readable.from('file')
    const destroySpy = vi.spyOn(stream, 'destroy')
    s3Mocks.getObjectStream.mockResolvedValueOnce(stream)
    artefactScanClientMocks.scanFileStream.mockRejectedValueOnce(new Error('boom'))
    const connector = new ModelScanFileScanningConnector()

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(destroySpy).toBeCalled()
  })

  test('ModelScanFileScanningConnector > returns error when scannerVersion is undefined', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({})
    const connector = new ModelScanFileScanningConnector()

    const result = await connector.scan({
      id: 'file1',
      name: 'model.bin',
      path: '/bucket/model.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(result.toolName).toBe('ModelScan')
    expect(result.scannerVersion).toBeUndefined()
  })

  test('TrivyImageScanningConnector > successful image scan', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      trivyVersion: '0.69.1',
    })
    authMocks.getAccessToken.mockResolvedValueOnce('token')
    const stream = Readable.from('layer')
    registryMocks.getRegistryLayerStream.mockResolvedValueOnce({
      stream,
      abort: vi.fn(),
    })
    artefactScanClientMocks.scanImageBlobStream.mockResolvedValueOnce({
      Results: [
        {
          Vulnerabilities: [
            {
              VulnerabilityID: 'CVE-1',
              Severity: 'HIGH',
              Title: 'Test vuln',
            },
            {
              VulnerabilityID: 'CVE-2',
              Severity: 'HIGH',
              Title: 'Test vuln 2A',
            },
            {
              VulnerabilityID: 'CVE-2',
              Severity: 'HIGH',
              Title: 'Test vuln 2B',
            },
          ],
        },
        {},
      ],
    })
    const connector = new TrivyImageScanningConnector()

    const result = await connector.scan({
      repository: 'repo',
      name: 'image',
      layerDigest: 'sha256:abc',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Complete)
    expect(result.summary).toHaveLength(2)
    expect(result.artefactKind).toBe(ArtefactKind.IMAGE)
  })

  test('TrivyImageScanningConnector > aborts registry stream on scan failure', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({
      trivyVersion: '0.69.1',
    })
    authMocks.getAccessToken.mockResolvedValueOnce('token')
    const abort = vi.fn()
    registryMocks.getRegistryLayerStream.mockResolvedValueOnce({
      stream: Readable.from('layer'),
      abort,
    })
    artefactScanClientMocks.scanImageBlobStream.mockRejectedValueOnce(new Error('scan failed'))
    const connector = new TrivyImageScanningConnector()

    const result = await connector.scan({
      repository: 'repo',
      name: 'image',
      layerDigest: 'sha256:abc',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(abort).toBeCalled()
  })

  test('TrivyImageScanningConnector > returns error when scannerVersion is undefined', async () => {
    artefactScanClientMocks.getCachedArtefactScanInfo.mockResolvedValueOnce({})
    const connector = new TrivyImageScanningConnector()

    const result = await connector.scan({
      repository: 'repo',
      name: 'image',
      layerDigest: 'sha256:abc',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(result.toolName).toBe('Trivy')
    expect(result.scannerVersion).toBeUndefined()
  })
})
