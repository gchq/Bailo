import { describe, expect, test, vi } from 'vitest'

import { ArtefactScanResult, ArtefactScanState } from '../../src/connectors/artefactScanning/Base.js'
import { ArtefactKind } from '../../src/models/Scan.js'
import { rerunFileScan, rerunImageScan, scanFile } from '../../src/services/scan.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/artefactScanning/index.js')
vi.mock('pretty-bytes')

const ScanModelMock = getTypedModelMock('ScanModel')

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
        authentication: {
          kind: 'silly',
        },
        audit: {
          kind: 'silly',
        },
        authorisation: {
          kind: 'basic',
        },
        artefactScanners: {
          kinds: ['clamAV'],
          retryDelayInMinutes: 5,
          maxInitRetries: 5,
          initRetryDelay: 5000,
        },
      },
      registry: {
        connection: {
          internal: 'https://localhost:5000',
          insecure: true,
        },
      },
      log: {
        level: 'debug',
      },
      instrumentation: {
        enabled: false,
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const authMocks = vi.hoisted(() => ({
  default: {
    file: vi.fn(() => ({ success: true, id: '123abc' })),
    model: vi.fn(() => ({ success: true, id: '123abc' })),
    image: vi.fn(() => ({ success: true, id: '123abc' })),
  },
}))
vi.mock('../../src/connectors/authorisation/index.js', () => authMocks)

const idMock = vi.hoisted(() => ({
  longId: vi.fn(() => 'mock-long-id'),
}))
vi.mock('../../src/utils/id.js', () => idMock)

const fileScanResult: ArtefactScanResult = {
  state: 'complete',
  toolName: 'Test',
  lastRunAt: new Date(),
  artefactKind: ArtefactKind.FILE,
}

const fileScanningMock = vi.hoisted(() => ({
  scannersInfo: vi.fn(() => [
    { toolName: 'fileScan', artefactKind: ArtefactKind.FILE, version: undefined },
    { toolName: 'imageScan', artefactKind: ArtefactKind.IMAGE, version: undefined },
  ]),
  startScans: vi.fn(() => [fileScanResult]),
}))
vi.mock('../../src/connectors/artefactScanning/index.js', async () => ({ default: fileScanningMock }))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(() => ({ id: 'model123', kind: 'model' }) as any),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const fileMocks = vi.hoisted(() => ({
  getFileById: vi.fn(() => ({ modelId: 'random_model', size: 1, name: 'file.txt' }) as any),
}))
vi.mock('../../src/services/file.js', () => fileMocks)

const releaseServiceMocks = vi.hoisted(() => ({
  removeFileFromReleases: vi.fn(),
}))
vi.mock('../../src/services/release.js', () => releaseServiceMocks)

const imageMocks = vi.hoisted(() => ({
  getImageLayers: vi.fn(() => [{ digest: 'sha256:layer1' }]),
}))
vi.mock('../../src/services/images/getImageLayers.js', () => imageMocks)

const testFileId = '73859F8D26679D2E52597326'

describe('services > scan', () => {
  describe('scanFile', () => {
    test('successfully scans a file and returns scan results', async () => {
      const scanResult = {
        state: ArtefactScanState.Complete,
        toolName: 'clamAv',
        artefactKind: ArtefactKind.FILE,
        lastRunAt: new Date(),
      }
      ScanModelMock.find.mockResolvedValueOnce([scanResult])
      ScanModelMock.updateOne.mockResolvedValueOnce(undefined)
      const file = {
        id: 'file123',
        _id: 'file123',
        toObject: () => ({ name: 'file.txt', size: 1 }),
      } as any

      const result = await scanFile(file)

      expect(result.scanResults).toEqual([scanResult])
      expect(result.name).toBe('file.txt')
    })

    test('runs scanners when scanning a file', async () => {
      ScanModelMock.find.mockResolvedValueOnce([])
      ScanModelMock.updateOne.mockResolvedValue(undefined)
      const file = {
        id: 'file123',
        _id: 'file123',
        toObject: () => ({ name: 'file.txt', size: 1 }),
      } as any

      await scanFile(file)

      expect(fileScanningMock.startScans).toHaveBeenCalledTimes(1)
    })

    test('returns file with no scan results when no scanners are enabled', async () => {
      fileScanningMock.scannersInfo.mockReturnValueOnce([])
      ScanModelMock.find.mockResolvedValueOnce([])
      const file = {
        id: 'file123',
        _id: 'file123',
        toObject: () => ({ name: 'file.txt', size: 1 }),
      } as any

      const result = await scanFile(file)

      expect(result.scanResults).toEqual([])
    })

    test('sets scan state to InProgress before completing', async () => {
      ScanModelMock.find.mockResolvedValueOnce([])
      ScanModelMock.updateOne.mockResolvedValue(undefined)
      const file = {
        id: 'file123',
        _id: 'file123',
        toObject: () => ({ name: 'file.txt', size: 1 }),
      } as any

      await scanFile(file)

      expect(ScanModelMock.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ artefactKind: ArtefactKind.FILE }),
        expect.objectContaining({
          $set: expect.objectContaining({ state: ArtefactScanState.InProgress }),
        }),
        expect.objectContaining({ upsert: true }),
      )
    })

    test('sets scan state to Error when scanner throws', async () => {
      fileScanningMock.startScans.mockImplementationOnce(() => {
        throw new Error('scanner failure')
      })
      ScanModelMock.find.mockResolvedValueOnce([])
      ScanModelMock.updateOne.mockResolvedValue(undefined)
      const file = {
        id: 'file123',
        _id: 'file123',
        toObject: () => ({ name: 'file.txt', size: 1 }),
      } as any
      await scanFile(file)

      expect(ScanModelMock.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          $set: expect.objectContaining({ state: ArtefactScanState.Error }),
        }),
        expect.anything(),
      )
    })
  })

  describe('rerunFileScan', () => {
    test('successfully reruns a file scan', async () => {
      const createdAtTimeInMilliseconds = new Date().getTime() - 2000000
      ScanModelMock.find.mockResolvedValueOnce([
        {
          state: ArtefactScanState.Complete,
          lastRunAt: new Date(createdAtTimeInMilliseconds),
        },
      ])

      const scanStatus = await rerunFileScan({} as any, 'model123', testFileId)

      expect(scanStatus).toBe('File scan started for file.txt')
      expect(fileScanningMock.startScans).not.toHaveBeenCalled()
    })

    test('triggers scan without awaiting (fire-and-forget)', async () => {
      ScanModelMock.find.mockResolvedValueOnce([])

      const result = await rerunFileScan({} as any, 'model123', testFileId)

      expect(result).toBe('File scan started for file.txt')
      expect(fileScanningMock.startScans).not.toHaveBeenCalled()
    })

    test('throws bad request when model is not found', async () => {
      modelMocks.getModelById.mockResolvedValueOnce(null)

      await expect(rerunFileScan({} as any, 'missingModel', testFileId)).rejects.toThrowError(
        /^Cannot find requested model/,
      )
    })

    test('throws bad request when file is not found', async () => {
      fileMocks.getFileById.mockResolvedValueOnce(null)

      await expect(rerunFileScan({} as any, 'model123', testFileId)).rejects.toThrowError(/^Cannot find requested file/)
    })

    test('throws bad request when attempting to upload an empty file', async () => {
      fileMocks.getFileById.mockResolvedValueOnce({ modelId: 'random_model', size: 0, name: 'file.txt' })

      await expect(rerunFileScan({} as any, 'model123', testFileId)).rejects.toThrowError(
        /^Cannot run scan on an empty file/,
      )
    })

    test('does not rerun file scan before delay is over', async () => {
      ScanModelMock.find.mockResolvedValueOnce([{ state: ArtefactScanState.Complete, lastRunAt: new Date() }])

      await expect(rerunFileScan({} as any, 'model123', testFileId)).rejects.toThrowError(
        /^Please wait 5 minutes before attempting a rescan file.txt/,
      )
    })

    test('throws forbidden when file authorisation fails', async () => {
      authMocks.default.file.mockResolvedValueOnce({ success: false, info: 'denied' } as any)

      await expect(rerunFileScan({ dn: 'user' } as any, 'model123', testFileId)).rejects.toThrowError(/^denied/)
    })

    test('throws forbidden when model update authorisation fails', async () => {
      authMocks.default.model.mockResolvedValueOnce({ success: false, info: 'denied' } as any)
      ScanModelMock.find.mockResolvedValueOnce([])

      await expect(rerunFileScan({ dn: 'user' } as any, 'model123', testFileId)).rejects.toThrowError(/^denied/)
    })

    test('throws service unavailable when no file scanners are enabled', async () => {
      fileScanningMock.scannersInfo.mockReturnValueOnce([])
      ScanModelMock.find.mockResolvedValueOnce([])

      await expect(rerunFileScan({} as any, 'model123', testFileId)).rejects.toThrowError(
        'No file scanners are enabled.',
      )
    })
  })

  describe('rerunImageScan', () => {
    test('successfully reruns an image scan', async () => {
      ScanModelMock.find.mockResolvedValueOnce([])

      const result = await rerunImageScan({} as any, 'model123', {
        repository: 'repo',
        name: 'image',
        tag: 'latest',
      } as any)

      expect(result).toBe('Image scan started for repo/image:latest')
      expect(fileScanningMock.startScans).not.toHaveBeenCalled()
    })

    test('throws bad request when model is not found (image scan)', async () => {
      modelMocks.getModelById.mockResolvedValueOnce(null)

      await expect(
        rerunImageScan({} as any, 'missingModel', { repository: 'repo', name: 'image', tag: 'latest' } as any),
      ).rejects.toThrowError(/^Cannot find requested model/)
    })

    test('throws forbidden when image authorisation fails', async () => {
      authMocks.default.image.mockResolvedValueOnce({ success: false, info: 'denied' } as any)
      ScanModelMock.find.mockResolvedValueOnce([])

      await expect(
        rerunImageScan({ dn: 'user' } as any, 'model123', { repository: 'repo', name: 'image', tag: 'latest' } as any),
      ).rejects.toThrowError(/^denied/)
    })

    test('throws forbidden when model update authorisation fails (image scan)', async () => {
      authMocks.default.model.mockResolvedValueOnce({ success: false, info: 'denied' } as any)
      ScanModelMock.find.mockResolvedValueOnce([])

      await expect(
        rerunImageScan({ dn: 'user' } as any, 'model123', { repository: 'repo', name: 'image', tag: 'latest' } as any),
      ).rejects.toThrowError(/^denied/)
    })

    test('does not rerun image scan before delay is over', async () => {
      imageMocks.getImageLayers.mockResolvedValueOnce([{ digest: 'sha256:layer1' }])
      ScanModelMock.find.mockResolvedValueOnce([{ state: ArtefactScanState.Complete, lastRunAt: new Date() }])

      await expect(
        rerunImageScan({} as any, 'model123', { repository: 'repo', name: 'image', tag: 'latest' } as any),
      ).rejects.toThrowError(/^Please wait 5 minutes before attempting a rescan repo\/image:latest/)
    })

    test('throws service unavailable when no image scanners are enabled', async () => {
      fileScanningMock.scannersInfo.mockReturnValueOnce([])
      imageMocks.getImageLayers.mockResolvedValueOnce([{ digest: 'sha256:layer1' }])
      ScanModelMock.find.mockResolvedValueOnce([])

      await expect(
        rerunImageScan({} as any, 'model123', { repository: 'repo', name: 'image', tag: 'latest' } as any),
      ).rejects.toThrowError('No image scanners are enabled.')
    })
  })
})
