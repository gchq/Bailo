import { Readable } from 'stream'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import authorisation from '../../../src/connectors/authorisation/index.js'
import { UserInterface } from '../../../src/models/User.js'
import { importDocuments } from '../../../src/services/importers/documentImporter.js'
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

const modelParserMock = vi.hoisted(() => ({
  parseFile: vi.fn(() => ({}) as any),
  parseModelCard: vi.fn(() => ({}) as any),
  parseRelease: vi.fn(() => ({}) as any),
}))
vi.mock('../../../src/services/parsers/modelParser.js', async () => modelParserMock)

const tarballMock = vi.hoisted(() => ({
  extractTarGzStream: vi.fn(),
}))
vi.mock('../../../src/utils/tarball.js', async () => tarballMock)

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(() => ({ settings: { mirror: { destinationModelId: '123' } }, card: { schemaId: 'test' } })),
  saveImportedModelCard: vi.fn(() => Promise.resolve({ completed: true })),
  setLatestImportedModelCard: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => modelMocks)

const releaseMocks = vi.hoisted(() => ({
  saveImportedRelease: vi.fn(() => ({ completed: true })),
}))
vi.mock('../../../src/services/release.js', () => releaseMocks)

const fileMocks = vi.hoisted(() => ({
  saveImportedFile: vi.fn(),
}))
vi.mock('../../../src/services/file.js', () => fileMocks)

const registryMocks = vi.hoisted(() => ({
  joinDistributionPackageName: vi.fn(),
}))
vi.mock('../../../src/services/registry.js', () => registryMocks)

const authMock = vi.hoisted(() => ({
  model: vi.fn<() => Response>(() => ({ id: 'test', success: true }) as any),
  releases: vi.fn<() => Response[]>(() => [{ id: 'test', success: true }] as any[]),
}))
vi.mock('../../../src/connectors/authorisation/index.js', async () => ({
  default: authMock,
}))

describe('services > importers > documentImporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('importDocuments > single model card file success', async () => {
    modelParserMock.parseModelCard.mockReturnValueOnce({ version: 1 })
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, entryListener, _errorListener, _finishListener) => {
        return new Promise((resolve, _reject) => {
          entryListener({ name: '0.json', type: 'file' }, {}, () => {})
          resolve('ok')
        })
      },
    )

    const result = await importDocuments(
      {} as UserInterface,
      {} as Readable,
      'mirroredModelId',
      'sourceModelId',
      'payloadUrl',
      'importId',
    )

    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).toBeCalledTimes(1)
    expect(modelParserMock.parseModelCard).toBeCalledTimes(1)
    expect(modelMocks.saveImportedModelCard).toBeCalledTimes(1)
    expect(modelMocks.setLatestImportedModelCard).toBeCalledTimes(1)
    expect(result).toMatchSnapshot()
  })

  test('importDocuments > single release file success', async () => {
    modelParserMock.parseRelease.mockReturnValueOnce({ semver: '0.0.1', images: [] })
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, entryListener, _errorListener, _finishListener) => {
        return new Promise((resolve, _reject) => {
          entryListener({ name: 'releases/0.json', type: 'file' }, {}, () => {})
          resolve('ok')
        })
      },
    )

    const result = await importDocuments(
      {} as UserInterface,
      {} as Readable,
      'mirroredModelId',
      'sourceModelId',
      'payloadUrl',
      'importId',
    )

    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).toBeCalledTimes(1)
    expect(modelParserMock.parseRelease).toBeCalledTimes(1)
    expect(releaseMocks.saveImportedRelease).toBeCalledTimes(1)
    expect(modelMocks.setLatestImportedModelCard).toBeCalledTimes(1)
    expect(result).toMatchSnapshot()
  })

  test('importDocuments > single file file success', async () => {
    modelParserMock.parseFile.mockReturnValueOnce({ _id: '123' })
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, entryListener, _errorListener, _finishListener) => {
        return new Promise((resolve, _reject) => {
          entryListener({ name: 'files/0.json', type: 'file' }, {}, () => {})
          resolve('ok')
        })
      },
    )

    const result = await importDocuments(
      {} as UserInterface,
      {} as Readable,
      'mirroredModelId',
      'sourceModelId',
      'payloadUrl',
      'importId',
    )

    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).toBeCalledTimes(1)
    expect(modelParserMock.parseFile).toBeCalledTimes(1)
    expect(fileMocks.saveImportedFile).toBeCalledTimes(1)
    expect(modelMocks.setLatestImportedModelCard).toBeCalledTimes(1)
    expect(result).toMatchSnapshot()
  })

  test('importDocuments > multiple files success', async () => {
    modelParserMock.parseModelCard.mockReturnValueOnce({ version: 1 }).mockReturnValueOnce({ version: 2 })
    modelParserMock.parseRelease
      .mockReturnValueOnce({
        semver: '0.0.1',
        images: [],
      })
      .mockReturnValueOnce({
        semver: '0.0.2',
        images: [
          {
            repository: 'repository',
            name: 'name',
            tag: 'tag',
          },
          {
            repository: 'repository',
            name: 'name',
            tag: 'tag2',
          },
        ],
      })
    modelParserMock.parseFile.mockReturnValueOnce({ _id: '123' }).mockReturnValueOnce({ _id: '456' })
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, entryListener, _errorListener, _finishListener) => {
        return new Promise((resolve, _reject) => {
          entryListener({ name: '0.json', type: 'file' }, {}, () => {})
          entryListener({ name: '1.json', type: 'file' }, {}, () => {})
          entryListener({ name: 'releases/0.json', type: 'file' }, {}, () => {})
          entryListener({ name: 'releases/1.json', type: 'file' }, {}, () => {})
          entryListener({ name: 'files/0.json', type: 'file' }, {}, () => {})
          entryListener({ name: 'files/1.json', type: 'file' }, {}, () => {})
          resolve('ok')
        })
      },
    )

    const result = await importDocuments(
      {} as UserInterface,
      {} as Readable,
      'mirroredModelId',
      'sourceModelId',
      'payloadUrl',
      'importId',
    )

    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).toBeCalledTimes(6)
    expect(modelParserMock.parseModelCard).toBeCalledTimes(2)
    expect(modelMocks.saveImportedModelCard).toBeCalledTimes(2)
    expect(modelParserMock.parseRelease).toBeCalledTimes(2)
    expect(registryMocks.joinDistributionPackageName).toBeCalledTimes(2)
    expect(releaseMocks.saveImportedRelease).toBeCalledTimes(2)
    expect(modelParserMock.parseFile).toBeCalledTimes(2)
    expect(fileMocks.saveImportedFile).toBeCalledTimes(2)
    expect(modelMocks.setLatestImportedModelCard).toBeCalledTimes(1)
    expect(result).toMatchSnapshot()
  })

  test('importDocuments > skip non-file entry', async () => {
    tarballMock.extractTarGzStream.mockImplementation(
      async (_tarGzStream, entryListener, _errorListener, _finishListener) => {
        return new Promise((resolve, _reject) => {
          entryListener({ name: 'dir', type: 'directory' }, {}, () => {})
          resolve('ok')
        })
      },
    )

    const result = await importDocuments(
      {} as UserInterface,
      {} as Readable,
      'mirroredModelId',
      'sourceModelId',
      'payloadUrl',
      'importId',
    )

    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).not.toBeCalled()
    expect(modelParserMock.parseModelCard).not.toBeCalled()
    expect(modelMocks.saveImportedModelCard).not.toBeCalled()
    expect(modelParserMock.parseRelease).not.toBeCalled()
    expect(registryMocks.joinDistributionPackageName).not.toBeCalled()
    expect(releaseMocks.saveImportedRelease).not.toBeCalled()
    expect(modelParserMock.parseFile).not.toBeCalled()
    expect(fileMocks.saveImportedFile).not.toBeCalled()
    expect(modelMocks.setLatestImportedModelCard).toBeCalledTimes(1)
    expect(result).toMatchSnapshot()
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

    const promise = importDocuments(
      {} as UserInterface,
      {} as Readable,
      'mirroredModelId',
      'sourceModelId',
      'payloadUrl',
      'importId',
    )

    expect(tarballMock.extractTarGzStream).toBeCalledTimes(1)
    expect(mockJson.json).toBeCalledTimes(1)
    expect(modelParserMock.parseModelCard).not.toBeCalled()
    expect(modelMocks.saveImportedModelCard).not.toBeCalled()
    expect(modelParserMock.parseRelease).not.toBeCalled()
    expect(registryMocks.joinDistributionPackageName).not.toBeCalled()
    expect(releaseMocks.saveImportedRelease).not.toBeCalled()
    expect(modelParserMock.parseFile).not.toBeCalled()
    expect(fileMocks.saveImportedFile).not.toBeCalled()
    expect(modelMocks.setLatestImportedModelCard).not.toBeCalled()
    expect(promise).rejects.toThrowError('Cannot parse compressed file: unrecognised contents.')
  })

  test('auth failure', async () => {
    modelParserMock.parseRelease.mockReturnValueOnce({ semver: '0.0.1', images: [] })
    vi.mocked(authorisation.releases).mockResolvedValueOnce([
      {
        id: '',
        success: false,
        info: 'User does not have access to release',
      },
    ])
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
            await entryListener({ name: 'releases/0.json', type: 'file' }, {}, () => {})
            finishListener(resolve, reject)
          } catch (err) {
            errorListener(err, resolve, reject)
          }
        })
      },
    )

    const promise = importDocuments(
      {} as UserInterface,
      {} as Readable,
      'mirroredModelId',
      'sourceModelId',
      'payloadUrl',
      'importId',
    )

    await expect(promise).rejects.toThrowError(/^Insufficient permissions to import the specified releases./)
  })
})
