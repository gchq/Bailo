import { Request } from 'express'
import { describe, expect, test } from 'vitest'

import { SillyAuthenticationConnector } from '../../../src/connectors/v2/authentication/silly.js'

describe('connectors > user > silly', () => {
  test('getUserFromReq', async () => {
    const connector = new SillyAuthenticationConnector()
    const user = await connector.getUserFromReq({} as Request)

    expect(user).toStrictEqual({ dn: 'user' })
  })
})
