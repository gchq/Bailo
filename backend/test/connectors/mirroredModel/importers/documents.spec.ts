import { PassThrough } from 'node:stream'

import { Headers } from 'tar-stream'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  DocumentsImporter,
  DocumentsMirrorMetadata,
} from '../../../../src/connectors/mirroredModel/importers/documents.js'
import { MirrorKind } from '../../../../src/connectors/mirroredModel/index.js'

const authMocks = vi.hoisted(() => ({
  default: {
    releases: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

const logMocks = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
}))
vi.mock('../../../../src/services/log.js', async () => ({
  default: logMocks,
}))

const entityParsersMocks = vi.hoisted(() => ({
  parseModelCard: vi.fn(),
  parseRelease: vi.fn(),
  parseFile: vi.fn(),
}))
vi.mock('../../../../src/services/mirroredModel/entityParsers.js', () => entityParsersMocks)

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
  saveImportedModelCard: vi.fn(),
  setLatestImportedModelCard: vi.fn(),
}))
vi.mock('../../../../src/services/model.js', () => modelMocks)

const releaseMocks = vi.hoisted(() => ({
  saveImportedRelease: vi.fn(),
}))
vi.mock('../../../../src/services/release.js', () => releaseMocks)

const fileMocks = vi.hoisted(() => ({
  saveImportedFile: vi.fn(),
}))
vi.mock('../../../../src/services/file.js', () => fileMocks)

const registryMocks = vi.hoisted(() => ({
  joinDistributionPackageName: vi.fn(() => 'repo/path:tag'),
}))
vi.mock('../../../../src/services/registry.js', () => registryMocks)

const mockUser = { dn: 'user' }
const mockMetadata: DocumentsMirrorMetadata = {
  importKind: MirrorKind.Documents,
  mirroredModelId: 'mirroredModelId',
  sourceModelId: 'sourceModelId',
  exporter: 'exporter',
} as DocumentsMirrorMetadata

describe('connectors > mirroredModel > importers > DocumentsImporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('constructor > success', () => {
    const importer = new DocumentsImporter(mockUser, mockMetadata)
    expect(importer).toMatchSnapshot()
  })

  test('constructor > error importKind not Documents', () => {
    const badMetadata = { ...mockMetadata, importKind: 'OtherKind' } as any
    expect(() => new DocumentsImporter(mockUser, badMetadata)).toThrowError(
      /^Cannot parse compressed Documents: incorrect metadata specified./,
    )
  })

  test('processEntry > success handle modelCard file', async () => {
    entityParsersMocks.parseModelCard.mockReturnValue({ version: 1 })
    modelMocks.saveImportedModelCard.mockResolvedValue({ saved: true })

    const importer = new DocumentsImporter(mockUser, mockMetadata)
    const entry: Headers = { name: 'content-dir/1.json', type: 'file' } as Headers
    const stream = new PassThrough()
    stream.end(JSON.stringify({ some: 'data' }))

    await importer.processEntry(entry, stream)

    expect(entityParsersMocks.parseModelCard).toHaveBeenCalled()
    expect(modelMocks.saveImportedModelCard).toHaveBeenCalled()
    expect(importer).toMatchSnapshot()
  })

  test('processEntry > success handle release file with auth success', async () => {
    entityParsersMocks.parseRelease.mockReturnValue({
      semver: '1.0.0',
      images: [{ repository: 'repo', name: 'path', tag: 'tag' }],
    })
    modelMocks.getModelById.mockResolvedValue({ id: mockMetadata.mirroredModelId })
    releaseMocks.saveImportedRelease.mockResolvedValue({ saved: true })
    authMocks.default.releases.mockResolvedValue([{ success: true }])

    const importer = new DocumentsImporter(mockUser, mockMetadata)
    const entry: Headers = {
      name: 'content-dir/releases/release1.json',
      type: 'file',
    } as Headers
    const stream = new PassThrough()
    stream.end(JSON.stringify({ some: 'release' }))

    await importer.processEntry(entry, stream)

    expect(entityParsersMocks.parseRelease).toHaveBeenCalled()
    expect(authMocks.default.releases).toHaveBeenCalled()
    expect(importer).toMatchSnapshot()
  })

  test('processEntry > error auth failure', async () => {
    entityParsersMocks.parseRelease.mockReturnValue({ semver: '2.0.0', images: [] })
    modelMocks.getModelById.mockResolvedValue({})
    authMocks.default.releases.mockResolvedValue([{ success: false }])

    const importer = new DocumentsImporter(mockUser, mockMetadata)
    const entry: Headers = {
      name: 'content-dir/releases/releaseFail.json',
      type: 'file',
    } as Headers
    const stream = new PassThrough()
    stream.end(JSON.stringify({ some: 'release' }))

    await expect(importer.processEntry(entry, stream)).rejects.toThrow(
      /^Insufficient permissions to import the specified releases./,
    )
  })

  test('processEntry > success handle file entry', async () => {
    entityParsersMocks.parseFile.mockResolvedValue({ _id: 'file-id' })
    fileMocks.saveImportedFile.mockResolvedValue(true)

    const importer = new DocumentsImporter(mockUser, mockMetadata)
    const entry: Headers = {
      name: 'content-dir/files/file1.json',
      type: 'file',
    } as Headers
    const stream = new PassThrough()
    stream.end(JSON.stringify({ some: 'file' }))

    await importer.processEntry(entry, stream)

    expect(entityParsersMocks.parseFile).toHaveBeenCalled()
    expect(fileMocks.saveImportedFile).toHaveBeenCalled()
    expect(importer).toMatchSnapshot()
  })

  test('processEntry > error unknown file path', async () => {
    const importer = new DocumentsImporter(mockUser, mockMetadata)
    const entry: Headers = {
      name: 'content-dir/unknown/file.json',
      type: 'file',
    } as Headers
    const stream = new PassThrough()
    stream.end(JSON.stringify({}))

    await expect(importer.processEntry(entry, stream)).rejects.toThrow(
      /^Cannot parse compressed file: unrecognised contents./,
    )
  })

  test('processEntry > success skip non-file entry', async () => {
    const importer = new DocumentsImporter(mockUser, mockMetadata)
    const entry: Headers = { name: 'dir', type: 'directory' } as Headers
    const stream = new PassThrough()

    await importer.processEntry(entry, stream)
    expect(importer).toMatchSnapshot()
  })

  test('finishListener > success', async () => {
    const importer = new DocumentsImporter(mockUser, mockMetadata)
    // @ts-expect-error accessing protected property
    importer.modelCardVersions.push(1)
    // @ts-expect-error accessing protected property
    importer.newModelCards.push({} as any)
    // @ts-expect-error accessing protected property
    importer.releaseSemvers.push('1.0.0')
    // @ts-expect-error accessing protected property
    importer.newReleases.push({} as any)
    // @ts-expect-error accessing protected property
    importer.fileIds.push('fid' as any)
    // @ts-expect-error accessing protected property
    importer.imageIds.push('iid')

    const resolve = vi.fn()
    const reject = vi.fn()

    await importer.finishListener(resolve, reject)
    expect(modelMocks.setLatestImportedModelCard).toHaveBeenCalledWith(mockMetadata.mirroredModelId)
    expect(resolve).toHaveBeenCalledWith({
      metadata: mockMetadata,
      modelCardVersions: [1],
      newModelCards: [{}],
      releaseSemvers: ['1.0.0'],
      newReleases: [{}],
      fileIds: ['fid'],
      imageIds: ['iid'],
    })
  })
})
