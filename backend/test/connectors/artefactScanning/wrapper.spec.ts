import { beforeEach, describe, expect, test, vi } from 'vitest'

import { BaseArtefactScanningConnector } from '../../../src/connectors/artefactScanning/Base.js'
import { ArtefactScanningWrapper } from '../../../src/connectors/artefactScanning/wrapper.js'
import { ArtefactKind, ArtefactScanState } from '../../../src/models/Scan.js'

vi.mock('../../../src/services/log.js')

const configMock = vi.hoisted(() => ({
  connectors: {
    artefactScanners: {
      maxInitRetries: 1,
      initRetryDelay: 0,
    },
  },
}))
vi.mock('../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

class TestFileScanner extends BaseArtefactScanningConnector {
  toolName = 'FileScanner'
  artefactType = ArtefactKind.FILE
  version = '1.0.0'
  queue = { size: 0, add: vi.fn((fn) => fn()) } as any

  init = vi.fn()
  _scan = vi.fn(async () => ({
    toolName: this.toolName,
    scannerVersion: this.version,
    artefactKind: this.artefactType,
    state: ArtefactScanState.Complete,
    lastRunAt: new Date(),
  }))
}

class TestImageScanner extends BaseArtefactScanningConnector {
  toolName = 'ImageScanner'
  artefactType = ArtefactKind.IMAGE
  version = '2.0.0'
  queue = { size: 0, add: vi.fn((fn) => fn()) } as any

  init = vi.fn()
  _scan = vi.fn(async () => ({
    toolName: this.toolName,
    scannerVersion: this.version,
    artefactKind: this.artefactType,
    state: ArtefactScanState.Complete,
    lastRunAt: new Date(),
  }))
}

describe('connectors > artefactScanning > wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('initialiseScanners() initialises all scanners', async () => {
    const scanner = new TestFileScanner()
    const wrapper = new ArtefactScanningWrapper(new Set([scanner]))

    await wrapper.initialiseScanners()

    expect(scanner.init).toHaveBeenCalled()
  })

  test('initialiseScanners() retries and then throws ServiceUnavailable', async () => {
    const scanner = new TestFileScanner()
    scanner.init.mockRejectedValue(new Error('init failed'))

    const wrapper = new ArtefactScanningWrapper(new Set([scanner]))

    await expect(wrapper.initialiseScanners()).rejects.toThrowError(
      'Could not initialise scanner after max attempts, make sure that it is setup and configured correctly.',
    )
  })

  test('scannersInfo() returns info for all scanners', () => {
    const fileScanner = new TestFileScanner()
    const imageScanner = new TestImageScanner()
    const wrapper = new ArtefactScanningWrapper(new Set([fileScanner, imageScanner]))

    const info = wrapper.scannersInfo()

    expect(info).toEqual([
      {
        toolName: 'FileScanner',
        scannerVersion: '1.0.0',
        artefactKind: ArtefactKind.FILE,
      },
      {
        toolName: 'ImageScanner',
        scannerVersion: '2.0.0',
        artefactKind: ArtefactKind.IMAGE,
      },
    ])
  })

  test('isMatchingInterface() matches file artefact', () => {
    const scanner = new TestFileScanner()
    const wrapper = new ArtefactScanningWrapper(new Set([scanner]))
    const artefact = { _id: 'file1', modelId: 'm1', name: 'file.bin' } as any

    const result = wrapper.isMatchingInterface(artefact, scanner)

    expect(result).toEqual({ matching: true, artefactType: ArtefactKind.FILE })
  })

  test('isMatchingInterface() matches image artefact', () => {
    const scanner = new TestImageScanner()
    const wrapper = new ArtefactScanningWrapper(new Set([scanner]))
    const artefact = { tag: 'latest', repository: 'repo', name: 'img' } as any

    const result = wrapper.isMatchingInterface(artefact, scanner)

    expect(result).toEqual({ matching: true, artefactType: ArtefactKind.IMAGE })
  })

  test('isMatchingInterface() throws on invalid artefact', () => {
    const scanner = new TestFileScanner()
    const wrapper = new ArtefactScanningWrapper(new Set([scanner]))

    expect(() => wrapper.isMatchingInterface({} as any, scanner)).toThrow(TypeError)
  })

  test('startScans() runs only matching scanners for file artefact', async () => {
    const fileScanner = new TestFileScanner()
    const imageScanner = new TestImageScanner()

    const wrapper = new ArtefactScanningWrapper(new Set([fileScanner, imageScanner]))

    const artefact = { _id: 'file1', modelId: 'm1', name: 'file.bin' } as any

    const results = await wrapper.startScans(artefact)

    expect(fileScanner._scan).toHaveBeenCalled()
    expect(imageScanner._scan).not.toHaveBeenCalled()
    expect(results).toHaveLength(1)
  })

  test('startScans() runs only matching scanners for image artefact', async () => {
    const fileScanner = new TestFileScanner()
    const imageScanner = new TestImageScanner()

    const wrapper = new ArtefactScanningWrapper(new Set([fileScanner, imageScanner]))

    const artefact = { repository: 'repository', name: 'name', tag: 'tag', layerDigest: 'sha256:1' } as any

    const results = await wrapper.startScans(artefact)

    expect(fileScanner._scan).not.toHaveBeenCalled()
    expect(imageScanner._scan).toHaveBeenCalled()
    expect(results).toHaveLength(1)
  })

  test('startScans() throws InternalError on incompatible artefact type', async () => {
    const scanner = new TestFileScanner()
    const wrapper = new ArtefactScanningWrapper(new Set([scanner]))
    const artefact = {} as any

    await expect(wrapper.startScans(artefact)).rejects.toBeInstanceOf(TypeError)
  })
})
