import { ModelDoc } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { UserDoc } from '../../../models/v2/User.js'
import { EntityKind, fromEntity, toEntity } from '../../../utils/v2/entity.js'
import { BaseAuthorisationConnector, ModelActionKeys } from './index.js'

export class SillyAuthorisationConnector implements BaseAuthorisationConnector {
  constructor() {
    // do nothing
  }

  async userModelAction(_user: UserDoc, _model: ModelDoc, _action: ModelActionKeys) {
    // With silly authorisation, every user can complete every action.
    return true
  }

  async userReleaseAction(_user: UserDoc, _model: ModelDoc, _release: ReleaseDoc, _action: string): Promise<boolean> {
    // With silly authorisation, every user can complete every action.
    return true
  }

  async getEntities(user: UserDoc) {
    return [toEntity(EntityKind.User, user.dn)]
  }

  async getUserInformation(entity: string): Promise<{ email: string }> {
    if (fromEntity(entity).kind !== EntityKind.User) {
      throw new Error('Cannot get user information for a non-user entity')
    }
    return {
      email: `${entity}@email.com`,
    }
  }

  async getGroupMembers(entity: string): Promise<string[]> {
    if (fromEntity(entity).kind !== EntityKind.User) {
      throw new Error('Cannot get user information for a non-user entity')
    }
    return [toEntity(EntityKind.User, 'user1'), toEntity(EntityKind.User, 'user2')]
    
  }
}
