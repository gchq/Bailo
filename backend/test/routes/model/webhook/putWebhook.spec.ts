import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { putWebhookSchema } from '../../../../src/routes/v2/model/webhook/putWebhook.js'
import { createFixture, testPut } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/webhook.js', () => ({
  updateWebhook: vi.fn(() => ({ id: 'test-webhook', modelId: 'test-model', name: 'test webhook' })),
}))

describe('routes > webhook > postWebhook', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(putWebhookSchema)
    const res = await testPut(`/api/v2/model/${fixture.params.modelId}/webhook/{${fixture.params.webhookId}}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(putWebhookSchema)
    const res = await testPut(`/api/v2/model/${fixture.params.modelId}/webhook/${fixture.params.webhookId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateWebhook).toHaveBeenCalled()
    expect(audit.onUpdateWebhook.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
