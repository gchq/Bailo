import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { ModelDoc } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { UserDoc } from '../../../models/v2/User.js'
import { fromEntity, toEntity } from '../../../utils/v2/entity.js'
import { AccessRequestActionKeys, BaseAuthorisationConnector, ModelActionKeys, ReleaseActionKeys } from './Base.js'

const SillyEntityKind = {
  User: 'user',
  Group: 'group',
} as const

export class SillyAuthorisationConnector extends BaseAuthorisationConnector {
  async userModelAction(_user: UserDoc, _model: ModelDoc, _action: ModelActionKeys) {
    // With silly authorisation, every user can complete every action.
    return true
  }

  async userReleaseAction(
    _user: UserDoc,
    _model: ModelDoc,
    _release: ReleaseDoc,
    _action: ReleaseActionKeys,
  ): Promise<boolean> {
    // With silly authorisation, every user can complete every action.
    return true
  }

  async userAccessRequestAction(
    _user: UserDoc,
    _model: ModelDoc,
    _accessRequest: AccessRequestDoc,
    _action: AccessRequestActionKeys,
  ) {
    // With silly authorisation, every user can complete every action.
    return true
  }

  async getEntities(user: UserDoc) {
    return [toEntity(SillyEntityKind.User, user.dn)]
  }

  async getUserInformation(entity: string): Promise<{ email: string }> {
    const entityObject = fromEntity(entity)
    if (entityObject.kind !== SillyEntityKind.User) {
      throw new Error(`Cannot get user information for a non-user entity: ${entity}`)
    }
    return {
      email: `${entityObject.value}@example.com`,
    }
  }

  async getEntityMembers(entity: string): Promise<string[]> {
    if (fromEntity(entity).kind === SillyEntityKind.User) {
      return [entity]
    } else if (fromEntity(entity).kind === SillyEntityKind.Group) {
      return [toEntity(SillyEntityKind.User, 'user1'), toEntity(SillyEntityKind.User, 'user2')]
    } else {
      throw new Error(`Unable to get Entity Members. Entity kind not recognised: ${entity}`)
    }
  }
}
