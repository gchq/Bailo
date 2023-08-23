import { Request } from 'express'

import { BaseUserConnector } from './index.js'

export class SillyUserConnector implements BaseUserConnector {
  constructor() {
    // do nothing
  }

  async getUserFromReq(_req: Request) {
    return {
      dn: 'user',
    }
  }
}
