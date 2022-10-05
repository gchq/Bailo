import mongoose from 'mongoose'
import SchemaModel from '../../models/Schema'
import '../../utils/mockMongo'
import { uploadSchema } from '../../utils/test/testModels'
import { authenticatedGetRequest, validateTestRequest } from '../../utils/test/testUtils'

describe('test schema routes', () => {
  beforeEach(async () => {
    await SchemaModel.create(uploadSchema)
  })

  test('that we can fetch schemas', async () => {
    const res = await authenticatedGetRequest('/api/v1/schemas').query({ use: 'UPLOAD' })
    validateTestRequest(res)
    expect(res.body.length).toBe(1)
  })

  test('that we can fetch default schema', async () => {
    const res = await authenticatedGetRequest('/api/v1/schema/default').query({ use: 'UPLOAD' })
    validateTestRequest(res)
    expect(res.body.name).toBe('upload-schema')
  })

  test('that we can fetch a schema by its reference', async () => {
    const res = await authenticatedGetRequest(`/api/v1/schema/${uploadSchema.reference}`).query({ use: 'UPLOAD' })
    validateTestRequest(res)
    expect(res.body.name).toBe('upload-schema')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
