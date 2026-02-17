import { describe, expect, test, vi } from 'vitest'

import { ArtefactScanResult, ArtefactScanState } from '../../src/connectors/artefactScanning/Base.js'
import { rerunFileScan } from '../../src/services/scan.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/authorisation/index.js')
vi.mock('../../src/connectors/artefactScanning/index.js')
vi.mock('pretty-bytes')

const FileModelMock = getTypedModelMock('FileModel')
const ScanModelMock = getTypedModelMock('ScanModel')

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
}))
vi.mock('../../src/services/log.js', async () => ({
  default: logMock,
}))

const configMock = vi.hoisted(
  () =>
    ({
      artefactScanning: {
        clamdscan: {
          host: 'test',
          port: 8080,
        },
      },
      s3: {
        multipartChunkSize: 5 * 1024 * 1024,
        buckets: {
          uploads: 'uploads',
          registry: 'registry',
        },
      },
      connectors: {
        artefactScanners: {
          kinds: ['clamAV'],
          retryDelayInMinutes: 5,
          maxInitRetries: 5,
          initRetryDelay: 5000,
        },
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const fileScanResult: ArtefactScanResult = {
  state: 'complete',
  toolName: 'Test',
  lastRunAt: new Date(),
}

const fileScanningMock = vi.hoisted(() => ({
  scannersInfo: vi.fn(() => ({ scannerNames: [] })),
  startScans: vi.fn(() => new Promise(() => [fileScanResult])),
}))
vi.mock('../../src/connectors/artefactScanning/index.js', async () => ({ default: fileScanningMock }))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(() => ({ settings: { mirror: { sourceModelId: '' } } })),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const releaseServiceMocks = vi.hoisted(() => ({
  removeFileFromReleases: vi.fn(),
}))
vi.mock('../../src/services/release.js', () => releaseServiceMocks)

const testFileId = '73859F8D26679D2E52597326'

describe('services > scan', () => {
  test('rerunFileScan > successfully reruns a file scan', async () => {
    const createdAtTimeInMilliseconds = new Date().getTime() - 2000000
    FileModelMock.aggregate.mockResolvedValueOnce([
      {
        name: 'file.txt',
        size: 123,
        _id: { toString: vi.fn(() => testFileId) },
      },
    ])
    ScanModelMock.find.mockResolvedValueOnce([
      {
        state: ArtefactScanState.Complete,
        lastRunAt: new Date(createdAtTimeInMilliseconds),
      },
    ])
    const scanStatus = await rerunFileScan({} as any, 'model123', testFileId)
    expect(scanStatus).toBe('Scan started for file.txt')
  })
  test('rerunFileScan > throws bad request when attempting to upload an empty file', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([
      {
        name: 'file.txt',
        size: 0,
        _id: { toString: vi.fn(() => testFileId) },
      },
    ])
    ScanModelMock.find.mockResolvedValueOnce([
      {
        state: ArtefactScanState.Complete,
      },
    ])
    await expect(rerunFileScan({} as any, 'model123', testFileId)).rejects.toThrowError(
      /^Cannot run scan on an empty file/,
    )
  })

  test('rerunFileScan > does not rerun file scan before delay is over', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([
      {
        name: 'file.txt',
        size: 123,
        _id: { toString: vi.fn(() => testFileId) },
      },
    ])
    ScanModelMock.find.mockResolvedValueOnce([{ state: ArtefactScanState.Complete, lastRunAt: new Date() }])
    await expect(rerunFileScan({} as any, 'model123', testFileId)).rejects.toThrowError(
      /^Please wait 5 minutes before attempting a rescan file.txt/,
    )
  })
})
