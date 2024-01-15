import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/v2/audit/__mocks__/index.js'
import { getFilesSchema } from '../../../../src/routes/v2/model/file/getFiles.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/v2/audit/index.js')
vi.mock('../../../../src/connectors/v2/authorisation/index.js')

const fileMock = vi.hoisted(() => {
  return {
    getFilesByModel: vi.fn(() => ['a', 'b'] as any),
  }
})
vi.mock('../../../../src/services/v2/file.js', () => fileMock)

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
    expect(audit.onViewFiles.mock.calls.at(0).at(1)).toMatchSnapshot()
    expect(audit.onViewFiles.mock.calls.at(0).at(2)).toMatchSnapshot()
  })
})
