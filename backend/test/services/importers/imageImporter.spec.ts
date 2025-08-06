import { Readable } from 'stream'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { UserInterface } from '../../../src/models/User.js'
import { importCompressedRegistryImage } from '../../../src/services/importers/imageImporter.js'
import { MockReadable, MockWritable } from '../../testUtils/streams.js'

const mockTarStream = {
  entry: vi.fn(({ _name, _size }) => {
    return new MockWritable()
  }),
  pipe: vi.fn().mockReturnThis(),
  finalize: vi.fn(),
}
const tarMocks = vi.hoisted(() => ({
  extract: vi.fn(() => new MockReadable()),
  pack: vi.fn(() => mockTarStream),
  constants: { Z_BEST_SPEED: 1 },
}))
vi.mock('tar-stream', () => tarMocks)

const mockJson = vi.hoisted(() => ({
  json: vi.fn(() => ({}) as any),
}))
vi.mock('node:stream/consumers', async () => mockJson)

const streamPromisesMocks = vi.hoisted(() => ({
  finished: vi.fn(() => Promise.resolve()),
}))
vi.mock('stream/promises', () => streamPromisesMocks)

const tarballMock = vi.hoisted(() => ({
  extractTarGzStream: vi.fn(),
}))
vi.mock('../../../src/utils/tarball.js', async () => tarballMock)

const typeguardMocks = vi.hoisted(() => ({
  hasKeysOfType: vi.fn(() => true),
}))
vi.mock('../../../src/utils/typeguards.js', () => typeguardMocks)

const registryMocks = vi.hoisted(() => ({
  doesImageLayerExist: vi.fn(() => Promise.resolve(false)),
  initialiseImageUpload: vi.fn(() => ({ location: 'location' })),
  putImageBlob: vi.fn(),
  putImageManifest: vi.fn(),
  splitDistributionPackageName: vi.fn(() => ({ domain: 'domain', path: 'path', tag: 'tag' }) as any),
}))
vi.mock('../../../src/services/registry.js', () => registryMocks)

describe('services > importers > imageImporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('importCompressedRegistryImage > manifest.json success', async () => {
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, entryListener, _errorListener, finishListener) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
          await entryListener({ name: 'manifest.json', type: 'file', size: 123 }, {}, () => {})
          finishListener(resolve, reject)
        })
      },
    )

    const result = await importCompressedRegistryImage(
      {} as UserInterface,
      {} as Readable,
      'modelId',
      'distributionPackageName',
      'importId',
    )

    expect(registryMocks.splitDistributionPackageName).toBeCalledTimes(1)
    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).toBeCalledTimes(1)
    expect(registryMocks.doesImageLayerExist).not.toBeCalled()
    expect(typeguardMocks.hasKeysOfType).toBeCalledTimes(1)
    expect(registryMocks.putImageManifest).toBeCalledTimes(1)
    expect(result).toMatchSnapshot()
  })

  test('importCompressedRegistryImage > skip non-file entry', async () => {
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, entryListener, _errorListener, _finishListener) => {
        return new Promise((resolve, _reject) => {
          entryListener({ name: 'dir', type: 'directory' }, {}, () => {})
          resolve('ok')
        })
      },
    )

    const result = await importCompressedRegistryImage(
      {} as UserInterface,
      {} as Readable,
      'modelId',
      'distributionPackageName',
      'importId',
    )

    expect(registryMocks.splitDistributionPackageName).toBeCalledTimes(1)
    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).not.toBeCalled()
    expect(registryMocks.doesImageLayerExist).not.toBeCalled()
    expect(typeguardMocks.hasKeysOfType).not.toBeCalled()
    expect(registryMocks.putImageManifest).not.toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('importCompressedRegistryImage > blob upload success', async () => {
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, entryListener, _errorListener, _finishListener) => {
        return new Promise((resolve, _reject) => {
          entryListener(
            { name: 'blobs/sha256/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', type: 'file' },
            {},
            () => {},
          )
          resolve('ok')
        })
      },
    )

    const result = await importCompressedRegistryImage(
      {} as UserInterface,
      {} as Readable,
      'modelId',
      'distributionPackageName',
      'importId',
    )

    expect(registryMocks.splitDistributionPackageName).toBeCalledTimes(1)
    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).not.toBeCalled()
    expect(registryMocks.doesImageLayerExist).toBeCalledTimes(1)
    expect(registryMocks.initialiseImageUpload).toBeCalledTimes(1)
    expect(registryMocks.putImageBlob).toBeCalledTimes(1)
    expect(streamPromisesMocks.finished).toBeCalledTimes(1)
    expect(typeguardMocks.hasKeysOfType).not.toBeCalled()
    expect(registryMocks.putImageManifest).not.toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('importCompressedRegistryImage > blob skip existing success', async () => {
    registryMocks.doesImageLayerExist.mockResolvedValueOnce(true)
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, entryListener, _errorListener, _finishListener) => {
        return new Promise((resolve, _reject) => {
          entryListener(
            { name: 'blobs/sha256/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', type: 'file' },
            { resume: vi.fn() },
            () => {},
          )
          resolve('ok')
        })
      },
    )

    const result = await importCompressedRegistryImage(
      {} as UserInterface,
      {} as Readable,
      'modelId',
      'distributionPackageName',
      'importId',
    )

    expect(registryMocks.splitDistributionPackageName).toBeCalledTimes(1)
    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).not.toBeCalled()
    expect(registryMocks.doesImageLayerExist).toBeCalledTimes(1)
    expect(registryMocks.initialiseImageUpload).not.toBeCalled()
    expect(registryMocks.putImageBlob).not.toBeCalled()
    expect(streamPromisesMocks.finished).not.toBeCalled()
    expect(typeguardMocks.hasKeysOfType).not.toBeCalled()
    expect(registryMocks.putImageManifest).not.toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('importCompressedRegistryImage > missing manifest.json', async () => {
    typeguardMocks.hasKeysOfType.mockReturnValueOnce(false)
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, _entryListener, errorListener, finishListener) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
          try {
            finishListener(resolve, reject)
          } catch (err) {
            errorListener(err, resolve, reject)
          }
        })
      },
    )

    const promise = importCompressedRegistryImage(
      {} as UserInterface,
      {} as Readable,
      'modelId',
      'distributionPackageName',
      'importId',
    )

    expect(registryMocks.splitDistributionPackageName).toBeCalledTimes(1)
    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).not.toBeCalled()
    expect(registryMocks.doesImageLayerExist).not.toBeCalled()
    expect(typeguardMocks.hasKeysOfType).toBeCalledTimes(1)
    expect(registryMocks.putImageManifest).not.toBeCalled()
    expect(promise).rejects.toThrowError('Could not find manifest.json in tarball')
  })

  test('importCompressedRegistryImage > invalid distributionPackageName', async () => {
    registryMocks.splitDistributionPackageName.mockReturnValueOnce({ domain: 'domain', path: 'path', digest: 'digest' })

    const promise = importCompressedRegistryImage(
      {} as UserInterface,
      {} as Readable,
      'modelId',
      'distributionPackageName',
      'importId',
    )

    expect(registryMocks.splitDistributionPackageName).toBeCalledTimes(1)
    expect(tarballMock.extractTarGzStream).not.toBeCalled()
    expect(mockJson.json).not.toBeCalled()
    expect(registryMocks.doesImageLayerExist).not.toBeCalled()
    expect(typeguardMocks.hasKeysOfType).not.toBeCalled()
    expect(registryMocks.putImageManifest).not.toBeCalled()
    expect(promise).rejects.toThrowError('Could not get tag from Distribution Package Name.')
  })

  test('importDocuments > error on invalid file entry name', async () => {
    tarballMock.extractTarGzStream.mockImplementation(
      (
        _tarGzStream,
        entryListener,
        errorListener = (err, _res, rej) => rej(err),
        finishListener = (res, _rej) => res('ok'),
      ) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
          try {
            await entryListener({ name: 'bad', type: 'file' }, {}, () => {})
            finishListener(resolve, reject)
          } catch (err) {
            errorListener(err, resolve, reject)
          }
        })
      },
    )

    const promise = importCompressedRegistryImage(
      {} as UserInterface,
      {} as Readable,
      'modelId',
      'distributionPackageName',
      'importId',
    )

    expect(registryMocks.splitDistributionPackageName).toBeCalledTimes(1)
    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).not.toBeCalled()
    expect(registryMocks.doesImageLayerExist).not.toBeCalled()
    expect(typeguardMocks.hasKeysOfType).not.toBeCalled()
    expect(registryMocks.putImageManifest).not.toBeCalled()
    expect(promise).rejects.toThrowError('Failed to parse compressed image - Unrecognised image contents.')
  })
})
