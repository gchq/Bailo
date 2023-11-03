import { Request } from 'express'

import { UserDoc } from '../../../models/v2/User.js'
import { fromEntity, toEntity } from '../../../utils/v2/entity.js'
import { BaseAuthenticationConnector, RoleKeys, Roles } from './Base.js'

const SillyEntityKind = {
  User: 'user',
  Group: 'group',
} as const

export class SillyAuthenticationConnector extends BaseAuthenticationConnector {
  constructor() {
    super()
  }

  async getUserFromReq(_req: Request) {
    return {
      dn: 'user',
    }
  }

  async hasRole(_user: UserDoc, role: RoleKeys) {
    if (role === Roles.Admin) {
      return true
    }
    return false
  }

  async queryEntities(_query: string) {
    return [
      {
        kind: SillyEntityKind.User,
        entities: [toEntity(SillyEntityKind.User, 'user1'), toEntity(SillyEntityKind.User, 'user2')],
      },
      {
        kind: SillyEntityKind.Group,
        entities: [toEntity(SillyEntityKind.Group, 'group1'), toEntity(SillyEntityKind.Group, 'group2')],
      },
    ]
  }

  async getEntities(user: UserDoc) {
    return [toEntity(SillyEntityKind.User, user.dn)]
  }

  async getUserInformation(entity: string): Promise<{ email: string }> {
    const { kind, value } = fromEntity(entity)

    if (kind !== SillyEntityKind.User) {
      throw new Error(`Cannot get user information for a non-user entity: ${entity}`)
    }

    return {
      email: `${value}@example.com`,
    }
  }

  async getEntityMembers(entity: string): Promise<string[]> {
    const { kind } = fromEntity(entity)
    switch (kind) {
      case SillyEntityKind.User:
        return [entity]
      case SillyEntityKind.Group:
        return [toEntity(SillyEntityKind.User, 'user1'), toEntity(SillyEntityKind.User, 'user2')]
      default:
        throw new Error(`Unable to get members, entity kind not recognised: ${entity}`)
    }
  }
}
