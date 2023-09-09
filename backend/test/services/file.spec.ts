import { Readable } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import { UserDoc } from '../../src/models/v2/User.js'
import { uploadModelFile } from '../../src/services/file.js'

const s3Mocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(() => ({ fileSize: 100 })),
}))
vi.mock('../../src/clients/s3.js', () => s3Mocks)

const authorisationMocks = vi.hoisted(() => ({
  userModelAction: vi.fn(() => true),
}))
vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  ...((await vi.importActual('../../src/connectors/v2/authorisation/index.js')) as object),
  default: authorisationMocks,
}))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/v2/model.js', () => modelMocks)

const fileModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.save = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/File.js', () => ({ default: fileModelMocks }))

describe('services > file', () => {
  test('uploadModelFile > success', async () => {
    const user = { dn: 'testUser' } as UserDoc
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const stream = new Readable()

    const result = await uploadModelFile(user, modelId, name, mime, stream)

    expect(s3Mocks.putObjectStream).toBeCalled()
    expect(fileModelMocks.save).toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('uploadModelFile > no permission', async () => {
    authorisationMocks.userModelAction.mockResolvedValueOnce(false)

    expect(() => uploadModelFile({} as any, 'modelId', 'name', 'mime', new Readable() as any)).rejects.toThrowError(
      /^You do not have permission to upload a file to this model./
    )
  })
})
