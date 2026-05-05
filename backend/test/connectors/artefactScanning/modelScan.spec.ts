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

vi.mock('p-queue', () => ({
  default: class {
    add(job: () => Promise<any>) {
      return job()
    }
  },
}))

describe('connectors > artefactScanning > modelScan', () => {
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
    expect(destroySpy).toHaveBeenCalled()
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
})
