import { NextFunction, Request, Response } from 'express'
import { Readable } from 'stream'
import { jest } from '@jest/globals'
import { testApproval, testModel, testModelUpload, testUser, testVersion2 } from '../../utils/test/testModels.js'
import { MulterFiles } from './upload.js'

const userService = await import('../../services/user.js')
jest.unstable_mockModule('../../services/user', () => ({
  ...userService,
  findAndUpdateUser: jest.fn(() => Promise.resolve(testUser)),
  serializedUserFields: () => ({
    mandatory: ['_id', 'id', 'email'],
  }),
}))

jest.unstable_mockModule('multer', () => ({
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
jest.unstable_mockModule('../../services/schema', () => ({
  ...schemaService,
  findSchemaByRef: jest.fn(() => Promise.resolve({ irrelevant: 'content' })),
  serializedSchemaFields: () => ({
    mandatory: ['_id', 'reference', 'name', 'use'],
  }),
}))

jest.unstable_mockModule('../../utils/validateSchema', () => ({
  validateSchema: jest.fn(),
}))

const minioUtils = await import('../../utils/minio.js')
const mockMinioUtils = {
  ...minioUtils,
  moveFile: jest.fn(),
}
jest.unstable_mockModule('../../utils/minio', () => mockMinioUtils)

const modelService = await import('../../services/model.js')
const mockModel = { ...testModel, save: jest.fn(() => Promise.resolve()) }
const mockModelService = {
  ...modelService,
  createModel: jest.fn(() => Promise.resolve()),
  findModelByUuid: jest.fn(() => Promise.resolve(mockModel)),
  serializedModelFields: () => ({
    mandatory: ['_id', 'uuid', 'latestVersion.metadata.highLevelDetails.name', 'schemaRef'],
  }),
}
jest.unstable_mockModule('../../services/model', () => mockModelService)

const versionService = await import('../../services/version.js')
const mockVersionService = {
  ...versionService,
  createVersion: jest.fn(() =>
    Promise.resolve({
      ...testVersion2,
      save: jest.fn(() => Promise.resolve()),
      populate: jest.fn(() => ({
        execPopulate: jest.fn(() => Promise.resolve([])),
      })),
    })
  ),
  serializedVersionFields: () => ({
    mandatory: [],
    optional: [],
    serializable: [],
  }),
}
jest.unstable_mockModule('../../services/version', () => mockVersionService)

const approvalService = await import('../../services/approval.js')
jest.unstable_mockModule('../../services/approval', () => ({
  ...approvalService,
  createVersionApprovals: jest.fn(() => Promise.all([Promise.resolve(testApproval), Promise.resolve(testApproval)])),
}))

const mockVersionModel = {
  default: {
    findOneAndUpdate: jest.fn(),
  },
}

jest.unstable_mockModule('../../models/Version', () => mockVersionModel)

const queuesUtils = await import('../../utils/queues.js')
const mockUploadQueue = {
  add: jest.fn(() => 'testJobId'),
}
jest.unstable_mockModule('../../utils/queues', () => ({
  ...queuesUtils,
  getUploadQueue: jest.fn(() => Promise.resolve(mockUploadQueue)),
}))

const { authenticatedPostRequest, validateTestRequest } = await import('../../utils/test/testUtils.js')

describe('test upload routes', () => {
  const path = `/api/v1/model?mode=newVersion&modelUuid=a-kpx5ua`
  const contentType = 'multipart/form-data; boundary=----WebKitFormBoundary1ZWhiXR3eQRjufe3'

  beforeEach(async () => {
    jest.clearAllMocks()
  })

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
