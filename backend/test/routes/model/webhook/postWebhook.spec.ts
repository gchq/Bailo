import { describe, expect, test, vi } from 'vitest'

import { postWebhookSchema } from '../../../../src/routes/v2/model/webhook/postWebhook.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/v2/audit/index.js')
vi.mock('../../../../src/connectors/v2/authorisation/index.js')

vi.mock('../../../../src/services/v2/webhook.js', () => ({
  createWebhook: vi.fn(),
}))

describe('routes > webhook > postWebhook', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postWebhookSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/webhooks`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
