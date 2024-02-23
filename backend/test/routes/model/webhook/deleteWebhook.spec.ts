import { describe, expect, test, vi } from 'vitest'

import { testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/webhook.js', () => ({
  removeWebhook: vi.fn(() => ({
    message: 'Successfully removed file.',
  })),
}))

describe('routes > webhook > deleteWebhook', () => {
  test('200 > ok', async () => {
    const res = await testDelete(`/api/v2/model/test-model/webhook/new-webhook`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
