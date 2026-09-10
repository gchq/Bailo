import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { addModelTag } from '../../../src/services/model.js'
import { testPost } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/services/model.js', () => ({
  addModelTag: vi.fn(() => ({ id: 'entry', tags: ['existing', 'new tag'] })),
}))

describe('routes > model > add tag', () => {
  test('normalises one tag and audits the addition', async () => {
    const response = await testPost('/api/v2/model/entry/tags', { body: { tag: ' New Tag ' } })
    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({ model: { id: 'entry', tags: ['existing', 'new tag'] } })
    expect(addModelTag).toHaveBeenCalledWith(expect.anything(), 'entry', 'new tag')
    expect(audit.onUpdateModel).toHaveBeenCalledWith(expect.anything(), response.body.model)
  })

  test.each([
    {},
    { tag: '' },
    { tag: '   ' },
    { tag: 12 },
    { tag: 'x'.repeat(101) },
    { tag: 'new', name: 'Changed name' },
    { tags: [] },
    { tag: 'new', collaborators: [] },
  ])('rejects invalid bodies or unrelated updates %j', async (body) => {
    const response = await testPost('/api/v2/model/entry/tags', { body })
    expect(response.statusCode).toBe(400)
    expect(addModelTag).not.toHaveBeenCalled()
    expect(audit.onUpdateModel).not.toHaveBeenCalled()
  })
})
