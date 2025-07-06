import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { patchFileSchema } from '../../../../src/routes/v2/model/file/patchFile.js'
import { createFixture, testPatch } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

describe('routes > file > patchFile', () => {
  test('200 > ok', async () => {
    vi.mock('../../../../src/services/file.js', () => ({
      updateFile: vi.fn(() => ({})),
    }))

    const fixture = createFixture(patchFileSchema)
    const res = await testPatch(`/api/v2/model/${fixture.params.modelId}/file/${fixture.params.fileId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(patchFileSchema)
    const res = await testPatch(`/api/v2/model/${fixture.params.modelId}/file/${fixture.params.fileId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateFile).toBeCalled()
    expect(audit.onUpdateFile.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
