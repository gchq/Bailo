import { PassThrough } from 'node:stream'

import { Headers } from 'tar-stream'
import { describe, expect, test, vi } from 'vitest'

import { BaseImporter } from '../../../../src/services/mirroredModel/importers/baseImporter.js'
import { ExportMetadata } from '../../../../src/services/mirroredModel/mirroredModel.js'
import { InternalError } from '../../../../src/utils/error.js'

class TestImporter extends BaseImporter {
  processEntry(_entry: Headers, _stream: PassThrough) {
    // mock implementation
  }
}

const mockMetadata: ExportMetadata = {
  sourceModelId: 'sourceModelId',
  mirroredModelId: 'mirroredModelId',
  exporter: 'exporter',
} as ExportMetadata
const mockLogData = { extra: 'info' }

describe('services > mirroredModel > importers > BaseImporter', () => {
  test('constructor > success', () => {
    const importer = new TestImporter(mockMetadata, mockLogData)
    expect(importer.metadata).toEqual(mockMetadata)
    expect(importer.logData).toEqual(mockLogData)
  })

  test('finishListener > success with metadata', async () => {
    const importer = new TestImporter(mockMetadata)
    const resolve = vi.fn()
    const reject = vi.fn()

    importer.finishListener(resolve, reject)

    expect(resolve).toHaveBeenCalledWith({ metadata: mockMetadata })
    expect(reject).not.toHaveBeenCalled()
  })

  test('errorListener > error with generic Error containing metadata and logData', () => {
    const importer = new TestImporter(mockMetadata, mockLogData)
    const error = new Error('failure')
    const resolve = vi.fn()
    const reject = vi.fn()

    importer.errorListener(error, resolve, reject)

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).toHaveBeenCalledTimes(1)
    const rejectedArg = reject.mock.calls[0][0]
    expect(rejectedArg).toEqual(
      InternalError('Error processing tarball during import.', {
        error,
        metadata: mockMetadata,
        ...mockLogData,
      }),
    )
  })

  test('errorListener > error with Bailo Error containing metadata and logData', () => {
    const importer = new TestImporter(mockMetadata, mockLogData)
    const error = InternalError('failure', { mockMetadata, mockLogData })
    const resolve = vi.fn()
    const reject = vi.fn()

    importer.errorListener(error, resolve, reject)

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).toHaveBeenCalledTimes(1)
    const rejectedArg = reject.mock.calls[0][0]
    expect(rejectedArg).toEqual(InternalError('failure', { mockMetadata, mockLogData }))
  })

  test('processEntry > success implemented by subclass', () => {
    const importer = new TestImporter(mockMetadata)
    const fakeEntry = {} as Headers
    const fakeStream = new PassThrough()

    expect(() => importer.processEntry(fakeEntry, fakeStream)).not.toThrow()
  })
})
