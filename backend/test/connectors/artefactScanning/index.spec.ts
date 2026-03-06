import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ArtefactScanKind } from '../../../src/connectors/artefactScanning/index.js'

const clamAvMocks = vi.hoisted(() => ({
  ClamAvFileScanningConnector: vi.fn(function () {}),
}))
vi.mock('../../../src/connectors/artefactScanning/clamAv.js', () => clamAvMocks)

vi.mock('../../../src/connectors/artefactScanning/artefactScan.js', () => ({
  ModelScanFileScanningConnector: vi.fn(function () {}),
  TrivyImageScanningConnector: vi.fn(function () {}),
}))
vi.mock('../../../src/connectors/artefactScanning/wrapper.js', () => ({
  ArtefactScanningWrapper: vi.fn(function () {
    return {
      initialiseScanners: vi.fn(),
    }
  }),
}))

const configMock = vi.hoisted(() => ({
  connectors: {
    artefactScanners: {
      kinds: [] as any,
    },
  },
}))
vi.mock('../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

async function loadModule() {
  return await import('../../../src/connectors/artefactScanning/index.js')
}

describe('connectors > artefactScanning > index', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  test('initialise ClamAV scanner when enabled', async () => {
    configMock.connectors.artefactScanners.kinds = [ArtefactScanKind.ClamAv]
    const mod = await loadModule()

    expect(mod.default).toBeDefined()
  })

  test('initialise ModelScan and Trivy scanners when enabled', async () => {
    configMock.connectors.artefactScanners.kinds = [ArtefactScanKind.ModelScan, ArtefactScanKind.Trivy]
    const mod = await loadModule()

    expect(mod.default).toBeDefined()
  })

  test('throw when scanner constructor throws', async () => {
    configMock.connectors.artefactScanners.kinds = [ArtefactScanKind.ClamAv]
    clamAvMocks.ClamAvFileScanningConnector.mockImplementationOnce(() => {
      throw new Error('init failed')
    })

    await expect(loadModule()).rejects.toThrowError('Could not configure or initialise scanner clamAV')
  })

  test('throw for invalid scanner kind', async () => {
    configMock.connectors.artefactScanners.kinds = ['invalidScanner'] as any

    await expect(loadModule()).rejects.toThrowError("'invalidScanner' is not a valid file scanning kind.")
  })

  test('return cached scannerWrapper when cache is enabled', async () => {
    configMock.connectors.artefactScanners.kinds = [ArtefactScanKind.ClamAv]

    const firstImport = await loadModule()
    const secondImport = await loadModule()

    expect(firstImport.default).toBe(secondImport.default)
  })
})
