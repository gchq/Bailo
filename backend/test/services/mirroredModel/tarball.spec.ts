import { PassThrough, Readable } from 'node:stream'
import zlib from 'node:zlib'

import { extract, pack } from 'tar-stream'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  addEntryToTarGzUpload,
  createUnTarGzStreams,
  extractTarGzStream,
  finaliseTarGzUpload,
  initialiseTarGzUpload,
} from '../../../src/services/mirroredModel/tarball.js'
import config from '../../../src/utils/__mocks__/config.js'

const authMocks = vi.hoisted(() => ({
  default: {
    model: vi.fn(),
  },
}))
vi.mock('../../../src/connectors/authorisation/index.js', () => authMocks)

const logMocks = vi.hoisted(() => ({
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../../src/services/log.js', async () => ({
  default: logMocks,
}))

const servicesModelMocks = vi.hoisted(() => ({
  validateMirroredModel: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => servicesModelMocks)

const s3Mocks = vi.hoisted(() => ({
  uploadToS3: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../../src/services/mirroredModel/s3.js', () => s3Mocks)

const mirroredModelMocks = vi.hoisted(() => {
  const processEntrySpy = vi.fn()
  const handleStreamCompletionSpy = vi.fn((resolve) => resolve())
  const handleStreamErrorSpy = vi.fn((error, _resolve, reject) => reject(error))
  const mockImporterClass = vi.fn(() => ({
    processEntry: processEntrySpy,
    handleStreamCompletion: handleStreamCompletionSpy,
    handleStreamError: handleStreamErrorSpy,
  }))

  return {
    MirrorKind: {
      Documents: 'documents',
      File: 'file',
      Image: 'image',
    },
    getImporter: vi.fn(() => mockImporterClass()),
    processEntrySpy,
    handleStreamCompletionSpy: handleStreamCompletionSpy,
    handleStreamErrorSpy: handleStreamErrorSpy,
  }
})
vi.mock('../../../src/services/mirroredModel/mirroredModel.js', () => mirroredModelMocks)

const dummyMetadata = {
  schemaVersion: 1,
  mirroredModelId: 'mid',
  sourceModelId: 'sid',
  importKind: mirroredModelMocks.MirrorKind.Documents,
  exporter: 'user',
  exportId: 'exportId',
}

function setUpExtractTarGzStreams() {
  const gzipStream = zlib.createGzip({ chunkSize: 16 * 1024 * 1024, level: zlib.constants.Z_BEST_SPEED })
  const tarStream = pack()
  const passThrough = new PassThrough()
  tarStream.pipe(gzipStream).pipe(passThrough)
  return { gzipStream, tarStream, passThrough }
}

describe('service > mirroredModel > tarball', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('initialiseTarGzUpload > success', async () => {
    const meta = { mirroredModelId: 'mid', importKind: mirroredModelMocks.MirrorKind.File }

    const { tarStream, gzipStream, uploadStream, uploadPromise } = await initialiseTarGzUpload(
      'file.tar.gz',
      meta as any,
      {} as any,
    )

    expect(gzipStream).toBeInstanceOf(zlib.createGzip().constructor)
    expect(tarStream).toBeInstanceOf(pack().constructor)
    expect(uploadStream).toBeInstanceOf(PassThrough)
    expect(uploadPromise).toBeInstanceOf(Promise)
    expect(s3Mocks.uploadToS3).toHaveBeenCalled()
  })

  test('initialiseTarGzUpload > clean up on error', async () => {
    const badMeta = {
      toJSON: () => {
        throw new Error('bad-json')
      },
    } as any
    // force pack.entry to throw
    const gzipDestroySpy = vi.spyOn(zlib.createGzip().constructor.prototype, 'destroy')
    const tarDestroySpy = vi.spyOn(pack().constructor.prototype, 'destroy')
    const uploadDestroySpy = vi.spyOn(new PassThrough().constructor.prototype, 'destroy')

    const promise = initialiseTarGzUpload('file.tar.gz', badMeta, {} as any)

    await expect(promise).rejects.toThrowError('bad-json')
    expect(gzipDestroySpy).toHaveBeenCalled()
    expect(tarDestroySpy).toHaveBeenCalled()
    expect(uploadDestroySpy).toHaveBeenCalled()
  })

  test('finaliseTarGzUpload > success', async () => {
    const { tarStream } = setUpExtractTarGzStreams()
    const finalizeSpy = vi.spyOn(tarStream, 'finalize')
    const uploadPromise = Promise.resolve()

    await finaliseTarGzUpload(tarStream, uploadPromise)

    expect(finalizeSpy).toHaveBeenCalled()
  })

  test('addEntryToTarGzUpload > success text entry', async () => {
    const { tarStream } = setUpExtractTarGzStreams()
    const entrySpy = vi.spyOn(tarStream, 'entry')

    await addEntryToTarGzUpload(tarStream, { type: 'text', filename: 'test.txt', content: 'hello' }, {} as any)

    expect(entrySpy).toHaveBeenCalled()
  })

  test('addEntryToTarGzUpload > success stream entry', async () => {
    const { tarStream } = setUpExtractTarGzStreams()
    // `cb: any` due to TS mis-inferring type
    const entrySpy = vi.spyOn(tarStream, 'entry').mockImplementation((_header, cb: any) => {
      cb?.()
      return new PassThrough()
    })
    const stream = new PassThrough()
    stream.end('data')

    await addEntryToTarGzUpload(tarStream, { type: 'stream', filename: 'bin', stream }, {} as any)

    expect(entrySpy).toHaveBeenCalled()
  })

  test('addEntryToTarGzUpload > error on stream entry', async () => {
    const { tarStream } = setUpExtractTarGzStreams()
    const tarEntryStream = new PassThrough()
    const entrySpy = vi.spyOn(tarStream, 'entry').mockImplementation((_header, cb: any) => {
      cb?.()
      return tarEntryStream
    })
    const stream = new PassThrough()
    setImmediate(() => {
      tarEntryStream.emit('error', new Error('error'))
    })

    const promise = addEntryToTarGzUpload(tarStream, { type: 'stream', filename: 'bin', stream }, {} as any)

    await expect(promise).rejects.toThrowError('error')
    expect(entrySpy).toHaveBeenCalled()
  })

  test('addEntryToTarGzUpload > reject when tarStream.entry callback receives error', async () => {
    const { tarStream } = setUpExtractTarGzStreams()
    const entrySpy = vi.spyOn(tarStream, 'entry').mockImplementation((_header, cb: any) => {
      cb?.(new Error('cb-error')) // trigger the reject(err) code path
      const pt = new PassThrough()
      pt.end() // ensure the stream closes so .pipe() won't hang
      return pt
    })
    const stream = new PassThrough()

    const promise = addEntryToTarGzUpload(tarStream, { type: 'stream', filename: 'bin', stream }, {} as any)

    await expect(promise).rejects.toThrow('cb-error')
    expect(entrySpy).toHaveBeenCalled()
  })

  test('addEntryToTarGzUpload > error on invalid type', async () => {
    const { tarStream } = setUpExtractTarGzStreams()

    const promise = addEntryToTarGzUpload(tarStream, { type: 'bad' } as any, {} as any)

    await expect(promise).rejects.toThrowError(/^Unable to handle entry for tar.gz packing stream./)
  })

  test('createUnTarGzStreams > success', () => {
    const { ungzipStream, untarStream } = createUnTarGzStreams()

    expect(ungzipStream).toBeInstanceOf(zlib.createGunzip().constructor)
    expect(untarStream).toBeInstanceOf(extract().constructor)
  })

  describe('extractTarGzStream', () => {
    test('success importKind Documents', async () => {
      const { tarStream, passThrough } = setUpExtractTarGzStreams()
      servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
      tarStream.entry(
        { name: config.modelMirror!.metadataFile!, type: 'file' },
        Buffer.from(JSON.stringify(dummyMetadata)),
      )
      tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
      tarStream.finalize()
      authMocks.default.model.mockResolvedValue({ success: true })

      await extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

      expect(authMocks.default.model).toHaveBeenCalled()
      expect(mirroredModelMocks.processEntrySpy).toHaveBeenCalled()
      expect(mirroredModelMocks.handleStreamCompletionSpy).toHaveBeenCalled()
    })

    test('success importKind File', async () => {
      const { tarStream, passThrough } = setUpExtractTarGzStreams()
      const meta = {
        schemaVersion: 1,
        mirroredModelId: 'mid',
        sourceModelId: 'sid',
        importKind: mirroredModelMocks.MirrorKind.File,
        filePath: 'test/file',
        exporter: 'user',
        exportId: 'exportId',
      }
      servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
      tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
      tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
      tarStream.finalize()
      authMocks.default.model.mockResolvedValue({ success: true })

      await extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

      expect(authMocks.default.model).toHaveBeenCalled()
      expect(mirroredModelMocks.processEntrySpy).toHaveBeenCalled()
      expect(mirroredModelMocks.handleStreamCompletionSpy).toHaveBeenCalled()
    })

    test('success importKind Image', async () => {
      const { tarStream, passThrough } = setUpExtractTarGzStreams()
      const meta = {
        schemaVersion: 1,
        mirroredModelId: 'mid',
        sourceModelId: 'sid',
        importKind: mirroredModelMocks.MirrorKind.Image,
        distributionPackageName: 'model/image:tag',
        exporter: 'user',
        exportId: 'exportId',
      }
      servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
      tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
      tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
      tarStream.finalize()
      authMocks.default.model.mockResolvedValue({ success: true })

      await extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

      expect(authMocks.default.model).toHaveBeenCalled()
      expect(mirroredModelMocks.processEntrySpy).toHaveBeenCalled()
      expect(mirroredModelMocks.handleStreamCompletionSpy).toHaveBeenCalled()
    })

    describe('error', () => {
      test('first entry is not metadata', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        tarStream.entry({ name: 'wrong.txt', type: 'file' }, Buffer.from('abc'))
        tarStream.finalize()

        const promise = extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError(/^Expected 'meta.json' as first entry, found 'wrong.txt'/)
      })

      test('invalid schemaVersion', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        const meta = {
          schemaVersion: -1,
          mirroredModelId: 'mid',
          sourceModelId: 'sid',
          importKind: mirroredModelMocks.MirrorKind.Documents,
          exporter: 'user',
          exportId: 'exportId',
        }
        servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
        tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
        tarStream.finalize()

        const promise = extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError(/^Error processing tarball during import./)
      })

      test('auth fails', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
        tarStream.entry(
          { name: config.modelMirror!.metadataFile!, type: 'file' },
          Buffer.from(JSON.stringify(dummyMetadata)),
        )
        tarStream.finalize()
        authMocks.default.model.mockResolvedValue({ success: false, info: 'nope' })

        const promise = extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError(/^nope/)
      })

      test('non-Bailo', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        const meta = {
          mirroredModelId: 'mid',
          sourceModelId: 'sid',
          importKind: mirroredModelMocks.MirrorKind.Documents,
        }
        servicesModelMocks.validateMirroredModel.mockRejectedValue('Error')
        tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
        tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
        tarStream.finalize()

        const promise = extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError('Error')
      })

      test('getImporter', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
        tarStream.entry(
          { name: config.modelMirror!.metadataFile!, type: 'file' },
          Buffer.from(JSON.stringify(dummyMetadata)),
        )
        tarStream.finalize()
        authMocks.default.model.mockResolvedValue({ success: true })
        mirroredModelMocks.getImporter.mockImplementationOnce(() => {
          throw new Error('fail')
        })

        const promise = extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError(/^Error processing tarball during import./)
        expect(authMocks.default.model).toHaveBeenCalled()
        expect(mirroredModelMocks.handleStreamErrorSpy).not.toHaveBeenCalled()
      })

      test('importer processEntry', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
        tarStream.entry(
          { name: config.modelMirror!.metadataFile!, type: 'file' },
          Buffer.from(JSON.stringify(dummyMetadata)),
        )
        tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
        tarStream.finalize()
        authMocks.default.model.mockResolvedValue({ success: true })
        mirroredModelMocks.processEntrySpy.mockRejectedValueOnce('Error')

        const promise = extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError('Error')
        expect(authMocks.default.model).toHaveBeenCalled()
        expect(mirroredModelMocks.processEntrySpy).toHaveBeenCalled()
        expect(mirroredModelMocks.handleStreamErrorSpy).toHaveBeenCalled()
      })

      test('early finish', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        tarStream.finalize()

        const promise = extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError(/^Tarball finished before importer initialisation./)
      })

      test('tar data is invalid', async () => {
        const gzippedJunk = zlib.gzipSync(Buffer.from('not a tar archive'))
        const badStream = new PassThrough()
        badStream.end(gzippedJunk)

        const promise = extractTarGzStream(badStream, { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError(/^Error processing tarball during import./)
      })

      test('gzip stream is invalid', async () => {
        const promise = extractTarGzStream(Readable.from(['']), { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError(/^Error processing tarball during import./)
      })

      test('async entry handler routed via handleStreamError', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
        authMocks.default.model.mockResolvedValue({ success: true })
        tarStream.entry(
          { name: config.modelMirror!.metadataFile!, type: 'file' },
          Buffer.from(JSON.stringify(dummyMetadata)),
        )
        // async failure after await
        mirroredModelMocks.processEntrySpy.mockImplementationOnce(async () => {
          await Promise.resolve()
          throw new Error('async importer failure')
        })
        tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
        tarStream.finalize()

        const promise = extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

        await expect(promise).rejects.toThrowError('async importer failure')
        expect(mirroredModelMocks.handleStreamErrorSpy).toHaveBeenCalled()
        expect(mirroredModelMocks.handleStreamCompletionSpy).not.toHaveBeenCalled()
      })

      test('importer throws then tar safely finishes', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
        authMocks.default.model.mockResolvedValue({ success: true })
        tarStream.entry(
          { name: config.modelMirror!.metadataFile!, type: 'file' },
          Buffer.from(JSON.stringify(dummyMetadata)),
        )
        mirroredModelMocks.processEntrySpy.mockRejectedValueOnce(new Error('entry failure'))
        tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
        tarStream.finalize()
        const rejectSpy = vi.fn()
        const resolveSpy = vi.fn()

        await extractTarGzStream(passThrough, { dn: 'user' }, {} as any)
          .then(resolveSpy)
          .catch(rejectSpy)
        expect(rejectSpy).toHaveBeenCalledTimes(1)
        expect(resolveSpy).not.toHaveBeenCalled()
      })

      test('no AbortError when importer fails mid-stream', async () => {
        const { tarStream, passThrough } = setUpExtractTarGzStreams()
        servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
        authMocks.default.model.mockResolvedValue({ success: true })
        tarStream.entry(
          { name: config.modelMirror!.metadataFile!, type: 'file' },
          Buffer.from(JSON.stringify(dummyMetadata)),
        )
        mirroredModelMocks.processEntrySpy.mockImplementationOnce(async () => {
          await new Promise((r) => setTimeout(r, 1))
          throw new Error('late async failure')
        })
        tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
        tarStream.finalize()

        const promise = extractTarGzStream(passThrough, { dn: 'user' }, {} as any)

        await expect(promise).rejects.not.toThrow(/AbortError/)
      })
    })
  })
})
