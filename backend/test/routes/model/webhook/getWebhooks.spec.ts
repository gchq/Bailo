import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/v2/audit/index.js')
vi.mock('../../../../src/connectors/v2/authorisation/index.js')

vi.mock('../../../../src/services/v2/webhook.js', () => ({
  getWebhooksByModel: vi.fn(() => ['webhook 1', 'webhook 2']),
}))

describe('routes > webhook > deleteWebhook', () => {
  test('200 > ok', async () => {
    const res = await testGet(`/api/v2/model/test-model/webhooks`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
