import { NextFunction, Request, Response } from 'express'
import { Readable } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import { testApproval, testModel, testModelUpload, testUser, testVersion2 } from '../../utils/test/testModels.js'
import { MulterFiles } from './upload.js'

vi.doMock('../../services/user', () => ({
  findAndUpdateUser: vi.fn(() => Promise.resolve(testUser)),
}))

vi.doMock('multer', () => ({
  __esModule: true,
  default: () => ({
    fields: () => (req: Omit<Request, 'files'> & { files: MulterFiles }, res: Response, next: NextFunction) => {
      req.body = {
        metadata: JSON.stringify(testModelUpload),
      }
      req.files = {
        binary: [
          {
            fieldname: 'binary',
            originalname: 'test.zip',
            encoding: '7bit',
            mimetype: 'application/zip',
            path: '89309830-6814-47d8-ac7a-d1a0276f1eeb',
            bucket: 'uploads',
            size: 123,
            stream: new Readable(),
            destination: 'destination',
            filename: 'filename',
            buffer: Buffer.from('test'),
          },
        ],
        code: [
          {
            fieldname: 'code',
            originalname: 'test.zip',
            encoding: '7bit',
            mimetype: 'application/zip',
            path: '8c35ff9e-1b34-44d4-9b68-14589a5d7f76',
            bucket: 'uploads',
            size: 123,
            stream: new Readable(),
            destination: 'destination',
            filename: 'filename',
            buffer: Buffer.from('test'),
          },
        ],
      }
      return next()
    },
  }),
}))

vi.doMock('../../services/schema', () => ({
  findSchemaByRef: vi.fn(() => Promise.resolve({ irrelevant: 'content' })),
}))

vi.doMock('../../utils/validateSchema', () => ({
  validateSchema: vi.fn(),
}))

const mockMinioUtils = {
  moveFile: vi.fn(),
}
vi.doMock('../../utils/minio', () => mockMinioUtils)

const mockModel = { ...testModel, save: vi.fn(() => Promise.resolve()) }
const mockModelService = {
  createModel: vi.fn(() => Promise.resolve()),
  findModelByUuid: vi.fn(() => Promise.resolve(mockModel)),
}
vi.doMock('../../services/model', () => mockModelService)

const mockVersionService = {
  createVersion: vi.fn(() =>
    Promise.resolve({
      ...testVersion2,
      save: vi.fn(() => Promise.resolve()),
      populate: vi.fn(() => ({
        execPopulate: vi.fn(() => Promise.resolve([])),
      })),
    })
  ),
}
vi.doMock('../../services/version', () => mockVersionService)

vi.doMock('../../services/approval', () => ({
  createVersionApprovals: vi.fn(() => Promise.all([Promise.resolve(testApproval), Promise.resolve(testApproval)])),
}))

const mockVersionModel = {
  default: {
    findOneAndUpdate: vi.fn(),
  },
}
vi.doMock('../../models/Version', () => mockVersionModel)

const mockUploadQueue = {
  add: vi.fn(() => 'testJobId'),
}
vi.doMock('../../utils/queues', () => ({
  getUploadQueue: vi.fn(() => Promise.resolve(mockUploadQueue)),
}))

const { authenticatedPostRequest, validateTestRequest } = await import('../../utils/test/testUtils.js')

describe('test upload routes', () => {
  const path = `/api/v1/model?mode=newVersion&modelUuid=a-kpx5ua`
  const contentType = 'multipart/form-data; boundary=----WebKitFormBoundary1ZWhiXR3eQRjufe3'

  test('that we can upload a version of an existing model in zip format', async () => {
    const res = await authenticatedPostRequest(path).set('Content-Type', contentType)
    validateTestRequest(res)
    expect(mockModelService.findModelByUuid).toBeCalledTimes(1)
    expect(mockVersionService.createVersion).toBeCalledTimes(1)
    expect(mockModel.latestVersion).toEqual(testVersion2._id)
    expect(mockMinioUtils.moveFile).toBeCalledTimes(2)
    expect(mockVersionModel.default.findOneAndUpdate).toBeCalledTimes(1)
    expect(mockUploadQueue.add).toBeCalledTimes(1)
    expect(res.body).toEqual({ uuid: testModel.uuid })
  })

  test('that we cant upload a version of an existing model in zip format without a unique name', async () => {
    mockVersionService.createVersion.mockRejectedValue({ code: 11000 })
    const res = await authenticatedPostRequest(path).set('Content-Type', contentType)
    expect(mockModelService.findModelByUuid).toBeCalledTimes(1)
    expect(mockVersionService.createVersion).toBeCalledTimes(1)
    expect(res.body).toEqual({ message: 'This model already has a version with the same name' })
    expect(res.statusCode).toEqual(409)
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
  })
})
