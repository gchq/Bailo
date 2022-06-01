import supertest from 'supertest'
import { server } from '../../index'
import mongoose from 'mongoose'
import '../../utils/mockMongo'
import SchemaModel from '../../models/Schema'

const request = supertest(server)
const uploadSchema: any = {
  name: 'upload-schema',
  reference: 'upload',
  use: 'UPLOAD',
  schema: {},
}

describe('test schema routes', () => {
  beforeEach(async () => {
    await SchemaModel.create(uploadSchema)
  })

  test('that we can fetch schemas', async () => {
    const res = await request
      .get('/api/v1/schemas')
      .set('x-userid', 'user')
      .set('x-email', 'test')
      .query({ use: 'UPLOAD' })
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
  })

  test('that we can fetch default schema', async () => {
    const res = await request
      .get('/api/v1/schema/default')
      .set('x-userid', 'user')
      .set('x-email', 'test')
      .query({ use: 'UPLOAD' })
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body.name).toBe('upload-schema')
  })

  test('that we can fetch a schema by its reference', async () => {
    const res = await request
      .get('/api/v1/schema/' + uploadSchema.reference)
      .set('x-userid', 'user')
      .set('x-email', 'test')
      .query({ use: 'UPLOAD' })
    expect(res.header['content-type']).toBe('application/json; charset=utf-8')
    expect(res.statusCode).toBe(200)
    expect(res.body.name).toBe('upload-schema')
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
