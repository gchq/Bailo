import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ArtefactScanKind } from '../../../src/connectors/artefactScanning/index.js'
import config from '../../../src/utils/config.js'

vi.mock('../../../src/services/log.js')

const clamAvMocks = vi.hoisted(() => ({
  ClamAvFileScanningConnector: vi.fn(function () {
    return { name: 'clamAV' }
  }),
}))
vi.mock('../../../src/connectors/artefactScanning/clamAv.js', () => clamAvMocks)

const trivyMocks = vi.hoisted(() => ({
  TrivyImageScanningConnector: vi.fn(function () {
    return { name: 'tryScanning' }
  }),
}))
vi.mock('../../../src/connectors/artefactScanning/trivy.js', () => trivyMocks)

const modelScanMocks = vi.hoisted(() => ({
  ModelScanFileScanningConnector: vi.fn(function () {
    return { name: 'modelScan' }
  }),
}))
vi.mock('../../../src/connectors/artefactScanning/modelScan.js', () => modelScanMocks)

vi.mock('../../../src/connectors/artefactScanning/wrapper.js', () => ({
  ArtefactScanningWrapper: vi.fn(function (input) {
    return {
      initialiseScanners: vi.fn(),
      scanners: Array.from(input),
    }
  }),
}))

const mockArtefactScannerKind = vi.hoisted(() => ({ kinds: [] as Array<string> }))

vi.mock('../../../src/utils/config.js', () => ({
  __esModule: true,
  default: {
    connectors: {
      artefactScanners: mockArtefactScannerKind,
    },
  },
}))

async function loadModule() {
  return await import('../../../src/connectors/artefactScanning/index.js')
}

describe('connectors > artefactScanning > index', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('initialise ClamAV scanner when enabled', async () => {
    config.connectors.artefactScanners.kinds = [ArtefactScanKind.ClamAv]
    const mod = await loadModule()

    expect(mod.default.scanners).toStrictEqual([
      {
        name: 'clamAV',
      },
    ])
  })

  test('initialise ModelScan and Trivy scanners when enabled', async () => {
    vi.spyOn(mockArtefactScannerKind, 'kinds', 'get').mockReturnValueOnce([
      ArtefactScanKind.ModelScan,
      ArtefactScanKind.Trivy,
    ])
    const mod = await loadModule()

    expect(mod.default.scanners).toStrictEqual([
      {
        name: 'modelScan',
      },
      {
        name: 'tryScanning',
      },
    ])
  })

  test('throw when scanner constructor throws', async () => {
    config.connectors.artefactScanners.kinds = [ArtefactScanKind.ClamAv]
    clamAvMocks.ClamAvFileScanningConnector.mockImplementationOnce(() => {
      throw new Error('init failed')
    })

    await expect(loadModule()).rejects.toThrow('Could not configure or initialise scanner clamAV')
  })

  test('throw for invalid scanner kind', async () => {
    config.connectors.artefactScanners.kinds = ['invalidScanner'] as any

    await expect(loadModule()).rejects.toThrow("'invalidScanner' is not a valid scanning kind.")
  })

  test('return cached scannerWrapper when cache is enabled', async () => {
    config.connectors.artefactScanners.kinds = [ArtefactScanKind.ClamAv]

    const firstImport = await loadModule()
    const secondImport = await loadModule()

    expect(firstImport.default).toBe(secondImport.default)
  })
})
