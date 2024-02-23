import { describe, expect, test, vi } from 'vitest'

import { putWebhookSchema } from '../../../../src/routes/v2/model/webhook/putWebhook.js'
import { createFixture, testPut } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/v2/webhook.js', () => ({
  updateWebhook: vi.fn(),
}))

describe('routes > webhook > postWebhook', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(putWebhookSchema)
    const res = await testPut(`/api/v2/model/${fixture.params.modelId}/webhook/{${fixture.params.webhookId}}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
