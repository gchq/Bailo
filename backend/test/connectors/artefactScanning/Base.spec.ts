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

  _scan = vi.fn()
}

describe('connectors > artefactScanning > Base', () => {
  test('info() returns scanner metadata', () => {
    const connector = new TestConnector()

    expect(connector.info()).toEqual({
      toolName: 'TestScanner',
      scannerVersion: '1.2.3',
      artefactKind: ArtefactKind.FILE,
    })
  })

  test('scan() queues and returns successful scan result', async () => {
    const connector = new TestConnector()
    const artefact = { id: 'file1' } as any

    connector._scan.mockResolvedValueOnce({
      toolName: 'TestScanner',
      scannerVersion: '1.2.3',
      artefactKind: ArtefactKind.FILE,
      state: ArtefactScanState.Complete,
      lastRunAt: new Date(),
    })

    const result = await connector.scan(artefact)

    expect(connector._scan).toHaveBeenCalledWith(artefact)
    expect(result.state).toBe(ArtefactScanState.Complete)
  })

  test('scan() converts thrown errors into scanError result', async () => {
    const connector = new TestConnector()
    const artefact = { id: 'file1' } as any

    connector._scan.mockRejectedValueOnce(new Error('boom'))

    const result = await connector.scan(artefact)

    expect(result.state).toBe(ArtefactScanState.Error)
    expect(result.toolName).toBe('TestScanner')
  })

  test('scan() handles invalid (non-object) queue return', async () => {
    const connector = new TestConnector()
    const artefact = { id: 'file1' } as any

    connector._scan.mockResolvedValueOnce(undefined as any)

    const result = await connector.scan(artefact)

    expect(result.state).toBe(ArtefactScanState.Error)
  })

  test('scanError() returns minimal error ArtefactScanResult', async () => {
    const connector = new TestConnector()

    // @ts-expect-ignore accessing protected property
    const result = connector['scanError']('failure')

    expect(result).toMatchObject({
      toolName: 'TestScanner',
      scannerVersion: '1.2.3',
      artefactKind: ArtefactKind.FILE,
      state: ArtefactScanState.Error,
    })
    expect(result.lastRunAt).toBeInstanceOf(Date)
  })

  test('scanSkip() returns minimal error ArtefactScanResult', async () => {
    const connector = new TestConnector()

    // @ts-expect-ignore accessing protected property
    const result = connector['scanSkip']('message')

    expect(result).toMatchObject({
      toolName: 'TestScanner',
      scannerVersion: '1.2.3',
      artefactKind: ArtefactKind.FILE,
      summary: ['message'],
      state: ArtefactScanState.Skipped,
    })
    expect(result.lastRunAt).toBeInstanceOf(Date)
  })

  test('skipContentTooLarge() returns minimal error ArtefactScanResult', async () => {
    const connector = new TestConnector()

    // @ts-expect-ignore accessing protected property
    const result = connector['skipContentTooLarge']({} as any, 456)

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
