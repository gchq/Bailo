import PQueue from 'p-queue'
import { describe, expect, test, vi } from 'vitest'

import { ArtefactScanState, BaseArtefactScanningConnector } from '../../../src/connectors/artefactScanning/Base.js'
import { ArtefactKind } from '../../../src/models/Scan.js'

vi.mock('../../../src/services/log.js')
vi.mock('bytes')

class TestConnector extends BaseArtefactScanningConnector {
  toolName = 'TestScanner'
  version = '1.2.3'
  artefactType = ArtefactKind.FILE
  queue = new PQueue({ concurrency: 1 })
  maxSize = 123

  init = vi.fn()

  executeScan = vi.fn()
}

describe('connectors > artefactScanning > Base', () => {
  test('getConnectorInfo() returns scanner metadata', () => {
    const connector = new TestConnector()

    expect(connector.getConnectorInfo()).toEqual({
      toolName: 'TestScanner',
      scannerVersion: '1.2.3',
      artefactKind: ArtefactKind.FILE,
    })
  })

  test('scan() queues and returns successful scan result', async () => {
    const connector = new TestConnector()
    const artefact = { id: 'file1' } as any

    connector.executeScan.mockResolvedValueOnce({
      toolName: 'TestScanner',
      scannerVersion: '1.2.3',
      artefactKind: ArtefactKind.FILE,
      state: ArtefactScanState.Complete,
      lastRunAt: new Date(),
    })

    const result = await connector.scan(artefact)

    expect(connector.executeScan).toHaveBeenCalledWith(artefact)
    expect(result.state).toBe(ArtefactScanState.Complete)
  })

  test('scan() converts thrown errors into scanError result', async () => {
    const connector = new TestConnector()
    const artefact = { id: 'file1' } as any

    connector.executeScan.mockRejectedValueOnce(new Error('boom'))

    const result = await connector.scan(artefact)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(result.toolName).toBe('TestScanner')
  })

  test('scan() handles invalid (non-object) queue return', async () => {
    const connector = new TestConnector()
    const artefact = { id: 'file1' } as any

    connector.executeScan.mockResolvedValueOnce(undefined as any)

    const result = await connector.scan(artefact)

    expect(result.state).toBe(ArtefactScanState.Error)
  })

  test('buildErrorResult() returns minimal error ArtefactScanResult', async () => {
    const connector = new TestConnector()

    // @ts-expect-ignore accessing protected property
    const result = connector['buildErrorResult']('failure')

    expect(result).toMatchObject({
      toolName: 'TestScanner',
      scannerVersion: '1.2.3',
      artefactKind: ArtefactKind.FILE,
      state: ArtefactScanState.Error,
    })
    expect(result.lastRunAt).toBeInstanceOf(Date)
  })

  test('buildSkipResult() returns minimal error ArtefactScanResult', async () => {
    const connector = new TestConnector()

    // @ts-expect-ignore accessing protected property
    const result = connector['buildSkipResult']('message')

    expect(result).toMatchObject({
      toolName: 'TestScanner',
      scannerVersion: '1.2.3',
      artefactKind: ArtefactKind.FILE,
      summary: ['message'],
      state: ArtefactScanState.Skipped,
    })
    expect(result.lastRunAt).toBeInstanceOf(Date)
  })

  test('buildSizeExceededResult() returns minimal error ArtefactScanResult', async () => {
    const connector = new TestConnector()

    // @ts-expect-ignore accessing protected property
    const result = connector['buildSizeExceededResult']({} as any, 456)

    expect(result).toMatchObject({
      toolName: 'TestScanner',
      scannerVersion: '1.2.3',
      artefactKind: ArtefactKind.FILE,
      summary: ['Artefact exceeds configured scanner size limit.'],
      state: ArtefactScanState.Error,
    })
    expect(result.lastRunAt).toBeInstanceOf(Date)
  })
})
