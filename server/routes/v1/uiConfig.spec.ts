import supertest from 'supertest'
import { server } from '../../index'

const request = supertest.agent(server);
//console.log(request)

describe('test UI config routes', () => {

  test('that we can fetch the correct UI config', async () => {
    /*const res = await request.get('/api/v1/config');
    console.log(res)
    expect(res.header['content-type']).toBe('text/html; charset=utf-8');
    expect(res.statusCode).toBe(200);
    expect(res.text).toEqual('hello world!');*/
  });

})