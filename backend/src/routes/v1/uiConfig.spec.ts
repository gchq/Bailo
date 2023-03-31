import mongoose from 'mongoose'
import '../../utils/mockMongo.js'
import { authenticatedGetRequest, validateTestRequest } from '../../utils/test/testUtils.js'

describe('test UI config routes', () => {
  test('that we can fetch the correct UI config', async () => {
    const res = await authenticatedGetRequest('/api/v1/config/ui')
    const data = JSON.parse(res.text)
    validateTestRequest(res)
    expect(data.banner).not.toBe(undefined)
    expect(data.registry).not.toBe(undefined)
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
