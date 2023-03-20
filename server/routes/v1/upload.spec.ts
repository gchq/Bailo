import { NextFunction } from 'express'
import VersionModel from '../../models/Version'
import * as modelService from '../../services/model'
import * as versionService from '../../services/version'
import * as minioUtils from '../../utils/minio'
import { testApproval, testModel, testModelUpload, testUser, testVersion2 } from '../../utils/test/testModels'
import { authenticatedPostRequest, validateTestRequest } from '../../utils/test/testUtils'

// Mock user service for user details in authenticated request
jest.mock('../../services/user', () => ({
  findAndUpdateUser: jest.fn(() => Promise.resolve(testUser)),
  serializedUserFields: () => ({
    mandatory: ['_id', 'id', 'email'],
  }),
}))

jest.mock('multer', () => ({
  __esModule: true,
  default: () => ({
    fields: () => (req: Request, res: Response, next: NextFunction) => {
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
          },
        ],
      }
      return next()
    },
  }),
}))

jest.mock('../../services/schema', () => ({
  findSchemaByRef: jest.fn(() => Promise.resolve({ irrelevant: 'content' })),
  serializedSchemaFields: () => ({
    mandatory: ['_id', 'reference', 'name', 'use'],
  }),
}))

jest.mock('../../utils/validateSchema', () => ({
  validateSchema: jest.fn(),
}))

jest.mock('../../utils/minio', () => ({
  moveFile: jest.fn(),
}))

const mockModel = { ...testModel, save: jest.fn(() => Promise.resolve()) }

jest.mock('../../services/model', () => ({
  createModel: jest.fn(() => Promise.resolve()),
  findModelByUuid: jest.fn(() => Promise.resolve(mockModel)),
  serializedModelFields: () => ({
    mandatory: ['_id', 'uuid', 'latestVersion.metadata.highLevelDetails.name', 'schemaRef'],
  }),
}))

jest.mock('../../services/version', () => ({
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
}))

jest.mock('../../services/approval', () => ({
  createVersionApprovals: jest.fn(() => Promise.all([Promise.resolve(testApproval), Promise.resolve(testApproval)])),
}))

jest.mock('../../models/Version', () => ({
  findOneAndUpdate: jest.fn(),
}))

const mockUploadQueue = {
  add: jest.fn(() => 'testJobId'),
}

jest.mock('../../utils/queues', () => ({
  getUploadQueue: jest.fn(() => Promise.resolve(mockUploadQueue)),
}))

jest.mock('minio', () => ({
  Client: jest.fn(() => ({
    putObject: jest.fn().mockImplementation((bucket, path, stream) => {
      // Stream must be read for middleware to progress
      stream.read()
    }),
  })),
}))

describe('test upload routes', () => {
  const path = `/api/v1/model?mode=newVersion&modelUuid=a-kpx5ua`
  const contentType = 'multipart/form-data; boundary=----WebKitFormBoundary1ZWhiXR3eQRjufe3'

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('that we can upload a version of an existing model in zip format', async () => {
    const res = await authenticatedPostRequest(path).set('Content-Type', contentType)

    validateTestRequest(res)
    expect(modelService.findModelByUuid).toBeCalledTimes(1)
    expect(versionService.createVersion).toBeCalledTimes(1)
    expect(mockModel.latestVersion).toEqual(testVersion2._id)
    expect(minioUtils.moveFile).toBeCalledTimes(2)
    expect(VersionModel.findOneAndUpdate).toBeCalledTimes(1)
    expect(mockUploadQueue.add).toBeCalledTimes(1)
    expect(res.body).toEqual({ uuid: testModel.uuid })
  })

  test('that we cant upload a version of an existing model in zip format without a unique name', async () => {
    ;(versionService.createVersion as jest.Mock).mockRejectedValueOnce({ code: 11000 })

    const res = await authenticatedPostRequest(path).set('Content-Type', contentType)

    expect(modelService.findModelByUuid).toBeCalledTimes(1)
    expect(versionService.createVersion).toBeCalledTimes(1)
    expect(res.body).toEqual({
      message: 'This model already has a version with the same name',
    })
    expect(res.statusCode).toEqual(409)
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
  })
})
