import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/webhook.js', () => ({
  getWebhooksByModel: vi.fn(() => ['webhook 1', 'webhook 2']),
}))

describe('routes > webhook > deleteWebhook', () => {
  test('200 > ok', async () => {
    const res = await testGet(`/api/v2/model/test-model/webhooks`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const res = await testGet(`/api/v2/model/test-model/webhooks`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewWebhooks).toHaveBeenCalled()
    expect(audit.onViewWebhooks.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
