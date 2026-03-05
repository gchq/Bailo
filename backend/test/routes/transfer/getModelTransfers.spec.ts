import { describe, expect, test, vi } from 'vitest'

import { getModelTransfersSchema } from '../../../src/routes/v2/modelTransfer/getModelTransfers.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

const mockModelTransferService = vi.hoisted(() => ({
  findModelTransfersByModelId: vi.fn(async () => [
    {
      _id: '699ed901eaa620f4a39631d7',
      modelId: '822ed901eaa620f4a39631d8',
      status: 'in_progress',
      createdBy: 'bob',
      createdAt: '2026-02-25T11:12:01.972Z',
      updatedAt: '2026-02-25T11:12:01.972Z',
    },
    {
      _id: '799ed901eaa620f4a39631d9',
      modelId: '822ed901eaa620f4a39631d8',
      status: 'completed',
      createdBy: 'alice',
      createdAt: '2026-02-26T09:30:00.000Z',
      updatedAt: '2026-02-26T09:30:00.000Z',
    },
  ]),
}))

vi.mock('../../../src/services/modelTransfer.js', () => mockModelTransferService)

describe('routes > model > getModelTransfers', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getModelTransfersSchema)

    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/transfers`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
