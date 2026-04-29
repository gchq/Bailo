import { Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import { ArtefactScanState } from '../../../src/connectors/artefactScanning/Base.js'
import { ClamAvFileScanningConnector } from '../../../src/connectors/artefactScanning/clamAv.js'
import { ArtefactKind } from '../../../src/models/Scan.js'

vi.mock('../../../src/clients/s3.js')
vi.mock('../../../src/services/log.js')

const clamAvMocks = vi.hoisted(() => {
  const scanStream = vi.fn()
  const getVersion = vi.fn()

  class NodeClamMock {
    init = vi.fn(async () => ({
      scanStream,
      getVersion,
    }))
  }

  return {
    NodeClamMock,
    scanStream,
    getVersion,
  }
})
vi.mock('clamscan', () => ({
  __esModule: true,
  default: clamAvMocks.NodeClamMock,
}))

const s3Mocks = vi.hoisted(() => ({
  getObjectStream: vi.fn(),
}))
vi.mock('../../../src/clients/s3.js', () => s3Mocks)

describe('connectors > artefactScanning > clamAv', () => {
  test('init() initialises ClamAV and parses version', async () => {
    clamAvMocks.getVersion.mockResolvedValueOnce('ClamAV 1.2.3/456')
    const connector = new ClamAvFileScanningConnector()

    await connector.init()

    expect(clamAvMocks.getVersion).toHaveBeenCalled()
    // @ts-expect-ignore accessing protected property
    expect(connector['version']).toBe('1.2.3')
  })

  test('scan() returns error when scanner is not initialised', async () => {
    const connector = new ClamAvFileScanningConnector()

    const result = await connector.scan({
      id: 'file1',
      name: 'file.bin',
      path: '/bucket/file.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(result.toolName).toBe('Clam AV')
  })

  test('scan() completes successfully with no viruses', async () => {
    clamAvMocks.getVersion.mockResolvedValueOnce('ClamAV 1.2.3/456')
    clamAvMocks.scanStream.mockResolvedValueOnce({ viruses: [] })
    const stream = Readable.from('file')
    const destroySpy = vi.spyOn(stream, 'destroy')
    s3Mocks.getObjectStream.mockResolvedValueOnce(stream)
    const connector = new ClamAvFileScanningConnector()
    await connector.init()

    const result = await connector.scan({
      id: 'file1',
      name: 'file.bin',
      path: '/bucket/file.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Complete)
    expect(result.summary).toEqual([])
    expect(result.artefactKind).toBe(ArtefactKind.FILE)
    expect(destroySpy).toHaveBeenCalled()
  })

  test('scan() returns error when ClamAV scan throws', async () => {
    clamAvMocks.getVersion.mockResolvedValueOnce('ClamAV 1.2.3/456')
    clamAvMocks.scanStream.mockRejectedValueOnce(new Error('scan failed'))
    const stream = Readable.from('file')
    const destroySpy = vi.spyOn(stream, 'destroy')
    s3Mocks.getObjectStream.mockResolvedValueOnce(stream)
    const connector = new ClamAvFileScanningConnector()
    await connector.init()

    const result = await connector.scan({
      id: 'file1',
      name: 'file.bin',
      path: '/bucket/file.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(destroySpy).toHaveBeenCalled()
  })

  test('scan() returns error when av unset', async () => {
    clamAvMocks.getVersion.mockResolvedValueOnce('1.2.3')
    const connector = new ClamAvFileScanningConnector()
    await connector.init()
    // @ts-expect-ignore accessing protected property
    connector['av'] = undefined

    const result = await connector.scan({
      id: 'file1',
      name: 'file.bin',
      path: '/bucket/file.bin',
    } as any)

    expect(result.state).toBe(ArtefactScanState.Error)
  })
})
