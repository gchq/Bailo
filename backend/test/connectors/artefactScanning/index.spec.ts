import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ArtefactScanKind } from '../../../src/connectors/artefactScanning/index.js'
import config from '../../../src/utils/config.js'

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

vi.mock('../../../src/utils/config.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/utils/config.js')>('../../../src/utils/config.js')
  const mutableConfig = structuredClone(actual.default)

  return { __esModule: true, default: mutableConfig }
})

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

    expect(mod.default).toBeDefined()
  })

  test('initialise ModelScan and Trivy scanners when enabled', async () => {
    config.connectors.artefactScanners.kinds = [ArtefactScanKind.ModelScan, ArtefactScanKind.Trivy]
    const mod = await loadModule()

    expect(mod.default).toBeDefined()
  })

  test('throw when scanner constructor throws', async () => {
    config.connectors.artefactScanners.kinds = [ArtefactScanKind.ClamAv]
    clamAvMocks.ClamAvFileScanningConnector.mockImplementationOnce(() => {
      throw new Error('init failed')
    })

    await expect(loadModule()).rejects.toThrowError('Could not configure or initialise scanner clamAV')
  })

  test('throw for invalid scanner kind', async () => {
    config.connectors.artefactScanners.kinds = ['invalidScanner'] as any

    await expect(loadModule()).rejects.toThrowError("'invalidScanner' is not a valid scanning kind.")
  })

  test('return cached scannerWrapper when cache is enabled', async () => {
    config.connectors.artefactScanners.kinds = [ArtefactScanKind.ClamAv]

    const firstImport = await loadModule()
    const secondImport = await loadModule()

    expect(firstImport.default).toBe(secondImport.default)
  })
})
