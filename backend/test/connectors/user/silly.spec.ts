import { Request } from 'express'
import { describe, expect, test } from 'vitest'

import { SillyUserConnector } from '../../../src/connectors/v2/user/silly.js'

describe('connectors > user > silly', () => {
  test('getUserFromReq', async () => {
    const connector = new SillyUserConnector()
    const user = await connector.getUserFromReq({} as Request)

    expect(user).toStrictEqual({ dn: 'user' })
  })
})
