import { PassThrough } from 'node:stream'
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
  info: vi.fn(),
  debug: vi.fn(),
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

const mirroredModelMocks = vi.hoisted(() => ({
  ImportKind: {
    Documents: 'documents',
    File: 'file',
    Image: 'image',
  },
}))
vi.mock('../../../src/services/mirroredModel/mirroredModel.js', () => mirroredModelMocks)

const ImporterMock = vi.hoisted(() => {
  const processEntrySpy = vi.fn()
  const finishListenerSpy = vi.fn((resolve) => resolve())
  const errorListenerSpy = vi.fn((error, _resolve, reject) => reject(error))
  const mockImporterClass = vi.fn(() => ({
    processEntry: processEntrySpy,
    finishListener: finishListenerSpy,
    errorListener: errorListenerSpy,
  }))
  return {
    DocumentsImporter: mockImporterClass,
    ImageImporter: mockImporterClass,
    FileImporter: mockImporterClass,
    processEntrySpy,
    finishListenerSpy,
    errorListenerSpy,
  }
})
vi.mock('../../../src/connectors/mirroredModel/importers/documents.js', () => ImporterMock)
vi.mock('../../../src/connectors/mirroredModel/importers/file.js', () => ImporterMock)
vi.mock('../../../src/connectors/mirroredModel/importers/image.js', () => ImporterMock)

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
    const meta = { mirroredModelId: 'mid', importKind: mirroredModelMocks.ImportKind.File }

    const { tarStream, gzipStream, uploadStream, uploadPromise } = await initialiseTarGzUpload(
      'file.tar.gz',
      meta as any,
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

    const promise = initialiseTarGzUpload('file.tar.gz', badMeta)

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

    await addEntryToTarGzUpload(tarStream, { type: 'text', filename: 'test.txt', content: 'hello' })

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

    await addEntryToTarGzUpload(tarStream, { type: 'stream', filename: 'bin', stream })

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

    const promise = addEntryToTarGzUpload(tarStream, { type: 'stream', filename: 'bin', stream })

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

    const promise = addEntryToTarGzUpload(tarStream, { type: 'stream', filename: 'bin', stream })

    await expect(promise).rejects.toThrow('cb-error')
    expect(entrySpy).toHaveBeenCalled()
  })

  test('addEntryToTarGzUpload > error on invalid type', async () => {
    const { tarStream } = setUpExtractTarGzStreams()

    const promise = addEntryToTarGzUpload(tarStream, { type: 'bad' } as any)

    await expect(promise).rejects.toThrowError(/^Unable to handle entry for tar.gz packing stream./)
  })

  test('createUnTarGzStreams > success', () => {
    const { ungzipStream, untarStream } = createUnTarGzStreams()

    expect(ungzipStream).toBeInstanceOf(zlib.createGunzip().constructor)
    expect(untarStream).toBeInstanceOf(extract().constructor)
  })

  test('extractTarGzStream > success DocumentsImporter', async () => {
    const { tarStream, passThrough } = setUpExtractTarGzStreams()
    const meta = {
      schemaVersion: 1,
      mirroredModelId: 'mid',
      sourceModelId: 'sid',
      importKind: mirroredModelMocks.ImportKind.Documents,
      exporter: 'user',
    }
    servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
    tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
    tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
    tarStream.finalize()
    authMocks.default.model.mockResolvedValue({ success: true })

    await extractTarGzStream(passThrough, { dn: 'user' })

    expect(authMocks.default.model).toHaveBeenCalled()
    expect(ImporterMock.processEntrySpy).toHaveBeenCalled()
    expect(ImporterMock.finishListenerSpy).toHaveBeenCalled()
  })

  test('extractTarGzStream > success FileImporter', async () => {
    const { tarStream, passThrough } = setUpExtractTarGzStreams()
    const meta = {
      schemaVersion: 1,
      mirroredModelId: 'mid',
      sourceModelId: 'sid',
      importKind: mirroredModelMocks.ImportKind.File,
      filePath: 'test/file',
      exporter: 'user',
    }
    servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
    tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
    tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
    tarStream.finalize()
    authMocks.default.model.mockResolvedValue({ success: true })

    await extractTarGzStream(passThrough, { dn: 'user' })

    expect(authMocks.default.model).toHaveBeenCalled()
    expect(ImporterMock.processEntrySpy).toHaveBeenCalled()
    expect(ImporterMock.finishListenerSpy).toHaveBeenCalled()
  })

  test('extractTarGzStream > success ImageImporter', async () => {
    const { tarStream, passThrough } = setUpExtractTarGzStreams()
    const meta = {
      schemaVersion: 1,
      mirroredModelId: 'mid',
      sourceModelId: 'sid',
      importKind: mirroredModelMocks.ImportKind.Image,
      distributionPackageName: 'model/image:tag',
      exporter: 'user',
    }
    servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
    tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
    tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
    tarStream.finalize()
    authMocks.default.model.mockResolvedValue({ success: true })

    await extractTarGzStream(passThrough, { dn: 'user' })

    expect(authMocks.default.model).toHaveBeenCalled()
    expect(ImporterMock.processEntrySpy).toHaveBeenCalled()
    expect(ImporterMock.finishListenerSpy).toHaveBeenCalled()
  })

  test('extractTarGzStream > error when first entry is not metadata', async () => {
    const { tarStream, passThrough } = setUpExtractTarGzStreams()
    tarStream.entry({ name: 'wrong.txt', type: 'file' }, Buffer.from('abc'))
    tarStream.finalize()

    const promise = extractTarGzStream(passThrough, { dn: 'user' })

    await expect(promise).rejects.toThrowError(/^Expected 'meta.json' as first entry, found 'wrong.txt'/)
  })

  test('extractTarGzStream > error invalid schemaVersion', async () => {
    const { tarStream, passThrough } = setUpExtractTarGzStreams()
    const meta = {
      schemaVersion: -1,
      mirroredModelId: 'mid',
      sourceModelId: 'sid',
      importKind: mirroredModelMocks.ImportKind.Documents,
      exporter: 'user',
    }
    servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
    tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
    tarStream.finalize()

    const promise = extractTarGzStream(passThrough, { dn: 'user' })

    await expect(promise).rejects.toThrowError(/^Error processing tarball during import./)
  })

  test('extractTarGzStream > error auth fails', async () => {
    const { tarStream, passThrough } = setUpExtractTarGzStreams()
    const meta = {
      schemaVersion: 1,
      mirroredModelId: 'mid',
      sourceModelId: 'sid',
      importKind: mirroredModelMocks.ImportKind.Documents,
      exporter: 'user',
    }
    servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
    tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
    tarStream.finalize()
    authMocks.default.model.mockResolvedValue({ success: false, info: 'nope' })

    const promise = extractTarGzStream(passThrough, { dn: 'user' })

    await expect(promise).rejects.toThrowError(/^nope/)
  })

  test('extractTarGzStream > error non-Bailo', async () => {
    const { tarStream, passThrough } = setUpExtractTarGzStreams()
    const meta = { mirroredModelId: 'mid', sourceModelId: 'sid', importKind: mirroredModelMocks.ImportKind.Documents }
    servicesModelMocks.validateMirroredModel.mockRejectedValue('Error')
    tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
    tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
    tarStream.finalize()

    const promise = extractTarGzStream(passThrough, { dn: 'user' })

    await expect(promise).rejects.toThrowError('Error')
  })

  test('extractTarGzStream > error DocumentsImporter', async () => {
    const { tarStream, passThrough } = setUpExtractTarGzStreams()
    const meta = {
      schemaVersion: 1,
      mirroredModelId: 'mid',
      sourceModelId: 'sid',
      importKind: mirroredModelMocks.ImportKind.Documents,
      exporter: 'user',
    }
    servicesModelMocks.validateMirroredModel.mockResolvedValue({ id: 'model', name: 'test' })
    tarStream.entry({ name: config.modelMirror!.metadataFile!, type: 'file' }, Buffer.from(JSON.stringify(meta)))
    tarStream.entry({ name: `${config.modelMirror!.contentDirectory}/f1`, type: 'file' }, Buffer.from('abc'))
    tarStream.finalize()
    authMocks.default.model.mockResolvedValue({ success: true })
    ImporterMock.processEntrySpy.mockRejectedValueOnce('Error')

    const promise = extractTarGzStream(passThrough, { dn: 'user' })

    await expect(promise).rejects.toThrowError('Error')
    expect(authMocks.default.model).toHaveBeenCalled()
    expect(ImporterMock.processEntrySpy).toHaveBeenCalled()
    expect(ImporterMock.errorListenerSpy).toHaveBeenCalled()
  })

  test('extractTarGzStream > error early finish', async () => {
    const { tarStream, passThrough } = setUpExtractTarGzStreams()
    tarStream.finalize()

    const promise = extractTarGzStream(passThrough, { dn: 'user' })

    await expect(promise).rejects.toThrowError(/^Tarball finished processing before expected./)
  })

  test('extractTarGzStream > error tar data is invalid', async () => {
    const gzippedJunk = zlib.gzipSync(Buffer.from('not a tar archive'))
    const badStream = new PassThrough()
    badStream.end(gzippedJunk)

    const promise = extractTarGzStream(badStream, { dn: 'user' })

    await expect(promise).rejects.toThrowError(/^Error processing tarball during import./)
  })
})
