import { UserDoc } from '../../../models/v2/User.js'
import { fromEntity, toEntity } from '../../../utils/v2/entity.js'
import { BaseAuthenticationConnector, RoleKeys, Roles, UserInformation } from './Base.js'

const SillyEntityKind = {
  User: 'user',
  Group: 'group',
} as const

export class SillyAuthenticationConnector extends BaseAuthenticationConnector {
  constructor() {
    super()
  }

  authenticationMiddleware() {
    return [
      {
        path: '/api/v2',
        middleware: [
          function (req, res, next) {
            req.user = { dn: 'user' }
            return next()
          },
        ],
      },
      ...super.authenticationMiddleware(),
    ]
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
        id: 'user',
      },
      {
        kind: SillyEntityKind.User,
        id: 'user2',
      },
      {
        kind: SillyEntityKind.Group,
        id: 'group1',
      },
      {
        kind: SillyEntityKind.Group,
        id: 'group2',
      },
    ]
  }

  async getEntities(user: UserDoc) {
    return [toEntity(SillyEntityKind.User, user.dn)]
  }

  async getUserInformation(entity: string): Promise<UserInformation> {
    const { kind, value } = fromEntity(entity)

    if (kind !== SillyEntityKind.User) {
      throw new Error(`Cannot get user information for a non-user entity: ${entity}`)
    }

    return {
      email: `${value}@example.com`,
      name: 'Joe Bloggs',
      organisation: 'Acme Corp',
    }
  }

  async getEntityMembers(entity: string): Promise<string[]> {
    const { kind } = fromEntity(entity)
    switch (kind) {
      case SillyEntityKind.User:
        return [entity]
      case SillyEntityKind.Group:
        return [toEntity(SillyEntityKind.User, 'user'), toEntity(SillyEntityKind.User, 'user2')]
      default:
        throw new Error(`Unable to get members, entity kind not recognised: ${entity}`)
    }
  }
}
