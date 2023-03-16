import '../../utils/mockMongo'

import * as versionService from '../../services/version'
import { testApproval, testModel, testVersion } from '../../utils/test/testModels'
import { authenticatedPostRequest, validateTestRequest } from '../../utils/test/testUtils'
import { getUser } from '../../utils/user'

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

jest.mock('../../services/model', () => ({
  createModel: jest.fn(() => Promise.resolve()),
  findModelByUuid: jest.fn(() => Promise.resolve({ ...testModel, save: jest.fn(() => Promise.resolve()) })),
  serializedModelFields: () => ({
    mandatory: ['_id', 'uuid', 'latestVersion.metadata.highLevelDetails.name', 'schemaRef'],
  }),
}))

jest.mock('../../services/version', () => ({
  createVersion: jest.fn(() =>
    Promise.resolve({
      ...testVersion,
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

jest.mock('../../utils/queues', () => ({
  getUploadQueue: jest.fn(() =>
    Promise.resolve({
      add: jest.fn(() => 'testJobId'),
    })
  ),
}))

jest.mock('../../services/user', () => ({
  findAndUpdateUser: jest.fn(() =>
    Promise.resolve({
      irrelevant: 'content',
      roles: ['user'],
    })
  ),
  serializedUserFields: () => ({
    mandatory: ['_id', 'id', 'email'],
  }),
}))

describe('test upload routes', () => {
  const formData =
    '------WebKitFormBoundary1ZWhiXR3eQRjufe3\r\nContent-Disposition: form-data; name="code"; filename="test.zip"\r\nContent-Type: application/zip\r\n\r\n\r\n------WebKitFormBoundary1ZWhiXR3eQRjufe3\r\nContent-Disposition: form-data; name="binary"; filename="test.zip"\r\nContent-Type: application/zip\r\n\r\n\r\n------WebKitFormBoundary1ZWhiXR3eQRjufe3\r\nContent-Disposition: form-data; name="docker"\r\n\r\nundefined\r\n------WebKitFormBoundary1ZWhiXR3eQRjufe3\r\nContent-Disposition: form-data; name="metadata"\r\n\r\n{"highLevelDetails":{"name":"a","modelInASentence":"a","modelOverview":"a","modelCardVersion":"ad","tags":["a"]},"contacts":{"uploader":[{"kind":"user","id":"user"}],"reviewer":[{"kind":"user","id":"user"}],"manager":[{"kind":"user","id":"user"}]},"buildOptions":{"uploadType":"Code and binaries","seldonVersion":"seldonio/seldon-core-s2i-python37:1.10.0"},"submission":{},"schemaRef":"/Minimal/General/v10"}\r\n------WebKitFormBoundary1ZWhiXR3eQRjufe3--\r\n'
  test('that we can upload a version', async () => {
    const res = await authenticatedPostRequest(`/api/v1/model?mode=newVersion&modelUuid=a-kpx5ua`, formData)

    validateTestRequest(res)
  })
  test('that we cant upload a version without a unique name', async () => {
    ;(versionService.createVersion as jest.Mock).mockRejectedValueOnce({ code: 11000 })

    const res = await authenticatedPostRequest(`/api/v1/model?mode=newVersion&modelUuid=a-kpx5ua`, formData)

    expect(res.body).toEqual({
      message: 'This model already has a version with the same name',
    })
    expect(res.statusCode).toEqual(409)
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
  })
})
