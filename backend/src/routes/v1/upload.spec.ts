import { NextFunction, Request, Response } from 'express'
import { Readable } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import { testApproval, testModel, testModelUpload, testUser, testVersion2 } from '../../utils/test/testModels.js'
import { MulterFiles } from './upload.js'

vi.mock('../../utils/user.js', () => {
  return {
    getUser: vi.fn((req: Request, _res: Response, next: NextFunction) => {
      req.user = testUser
      next()
    }),
    ensureUserRole: vi.fn(() => {
      return vi.fn((req: Request, _res: Response, next: NextFunction) => {
        console.log('called')
        next()
      })
    }),
  }
})

const userService = await import('../../services/user.js')
vi.doMock('../../services/user', () => ({
  ...userService,
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

const schemaService = await import('../../services/schema.js')
vi.doMock('../../services/schema', () => ({
  ...schemaService,
  findSchemaByRef: vi.fn(() => Promise.resolve({ irrelevant: 'content' })),
}))

vi.doMock('../../utils/validateSchema', () => ({
  validateSchema: vi.fn(),
}))

const minioUtils = await import('../../utils/minio.js')
const mockMinioUtils = {
  ...minioUtils,
  moveFile: vi.fn(),
}
vi.doMock('../../utils/minio', () => mockMinioUtils)

const modelService = await import('../../services/model.js')
const mockModel = { ...testModel, save: vi.fn(() => Promise.resolve()) }
const mockModelService = {
  ...modelService,
  createModel: vi.fn(() => Promise.resolve()),
  findModelByUuid: vi.fn(() => Promise.resolve(mockModel)),
}
vi.doMock('../../services/model', () => mockModelService)

const versionService = await import('../../services/version.js')
const mockVersionService = {
  ...versionService,
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

const approvalService = await import('../../services/approval.js')
vi.doMock('../../services/approval', () => ({
  ...approvalService,
  createVersionApprovals: vi.fn(() => Promise.all([Promise.resolve(testApproval), Promise.resolve(testApproval)])),
}))

const mockVersionModel = {
  default: {
    findOneAndUpdate: vi.fn(),
  },
}

vi.doMock('../../models/Version', () => mockVersionModel)

const queuesUtils = await import('../../utils/queues.js')
const mockUploadQueue = {
  add: vi.fn(() => 'testJobId'),
}
vi.doMock('../../utils/queues', () => ({
  ...queuesUtils,
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
