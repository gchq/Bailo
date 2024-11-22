import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getFilesSchema } from '../../../../src/routes/v2/model/file/getFiles.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

const fileMock = vi.hoisted(() => {
  return {
    getFilesByModel: vi.fn(() => ['a', 'b'] as any),
  }
})
vi.mock('../../../../src/services/file.js', () => fileMock)

describe('routes > files > getFiles', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getFilesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/files`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getFilesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/files`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewFiles).toBeCalled()
    expect(audit.onViewFiles.mock.calls.at(0)?.at(1)).toMatchSnapshot()
    expect(audit.onViewFiles.mock.calls.at(0)?.at(2)).toMatchSnapshot()
  })
})
