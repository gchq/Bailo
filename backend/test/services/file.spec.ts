import { Readable } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import { FileAction } from '../../src/connectors/v2/authorisation/Base.js'
import { UserDoc } from '../../src/models/v2/User.js'
import { downloadFile, getFilesByModel, removeFile, uploadFile } from '../../src/services/v2/file.js'

vi.mock('../../src/utils/config.js')

const s3Mocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(() => ({ fileSize: 100 })),
  getObjectStream: vi.fn(() => 'fileStream'),
}))
vi.mock('../../src/clients/s3.js', () => s3Mocks)

const authorisationMocks = vi.hoisted(() => ({
  userModelAction: vi.fn(() => true),
  userFileAction: vi.fn((_user, _model, _file, _action) => true),
}))
vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  default: authorisationMocks,
}))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/v2/model.js', () => modelMocks)

const fileModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.save = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/File.js', () => ({ default: fileModelMocks }))

describe('services > file', () => {
  test('uploadFile > success', async () => {
    const user = { dn: 'testUser' } as UserDoc
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const stream = new Readable() as any
    fileModelMocks.save.mockResolvedValueOnce({ example: true })

    const result = await uploadFile(user, modelId, name, mime, stream)

    expect(s3Mocks.putObjectStream).toBeCalled()
    expect(fileModelMocks.save).toBeCalled()
    expect(result.save).toBe(fileModelMocks.save)
  })

  test('uploadFile > no permission', async () => {
    authorisationMocks.userFileAction.mockResolvedValueOnce(false)

    expect(() => uploadFile({} as any, 'modelId', 'name', 'mime', new Readable() as any)).rejects.toThrowError(
      /^You do not have permission to upload a file to this model./,
    )
  })

  test('removeFile > success', async () => {
    const user = { dn: 'testUser' } as UserDoc
    const modelId = 'testModelId'
    const fileId = 'testFileId'

    const result = await removeFile(user, modelId, fileId)

    expect(result).toMatchSnapshot()
  })

  test('removeFile > no permission', async () => {
    authorisationMocks.userModelAction.mockResolvedValueOnce(true)
    authorisationMocks.userFileAction.mockImplementation((_user, _model, _file, action) => {
      if (action === FileAction.View) return true
      if (action === FileAction.Delete) return false

      return false
    })

    const user = { dn: 'testUser' } as UserDoc
    const modelId = 'testModelId'
    const fileId = 'testFileId'

    expect(() => removeFile(user, modelId, fileId)).rejects.toThrowError(
      /^You do not have permission to delete a file from this model./,
    )

    expect(fileModelMocks.delete).not.toBeCalled()
  })

  test('getFilesByModel > success', async () => {
    fileModelMocks.find.mockResolvedValueOnce([{ example: 'file' }])

    const user = { dn: 'testUser' } as UserDoc
    const modelId = 'testModelId'

    const result = await getFilesByModel(user, modelId)

    expect(result).toMatchSnapshot()
  })

  test('getFilesByModel > no permission', async () => {
    authorisationMocks.userFileAction.mockResolvedValue(false)
    fileModelMocks.find.mockResolvedValueOnce([{ example: 'file' }])

    const user = { dn: 'testUser' } as UserDoc
    const modelId = 'testModelId'

    const files = await getFilesByModel(user, modelId)
    expect(files).toStrictEqual([])
  })

  test('downloadFile > success', async () => {
    const user = { dn: 'testUser' } as UserDoc
    const fileId = 'testFileId'
    const range = { start: 0, end: 50 }

    const result = await downloadFile(user, fileId, range)

    expect(result).toBe('fileStream')
  })

  test('downloadFile > no permission', async () => {
    const user = { dn: 'testUser' } as UserDoc
    const fileId = 'testFileId'
    const range = { start: 0, end: 50 }

    authorisationMocks.userFileAction.mockImplementation((_user, _model, _file, action) => {
      if (action === FileAction.View) return true
      if (action === FileAction.Download) return false

      return false
    })
    await expect(downloadFile(user, fileId, range)).rejects.toThrowError(
      /^You do not have permission to download this model./,
    )
  })
})
