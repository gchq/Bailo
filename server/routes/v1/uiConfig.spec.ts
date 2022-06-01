import supertest from 'supertest'
import { server } from '../../index'
import mongoose from 'mongoose'
import '../../utils/mockMongo'

const request = supertest(server)

describe('test UI config routes', () => {
  test('that we can fetch the correct UI config', async () => {
    const res = await request.get('/api/v1/config').set('x-userid', 'user').set('x-email', 'test')
    const data = JSON.parse(res.text)
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(data.banner).not.toBe(undefined)
    expect(data.registry).not.toBe(undefined)
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
