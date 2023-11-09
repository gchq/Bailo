import { Request } from 'express'

import { ModelDoc } from '../../../models/v2/Model.js'
import { UserDoc } from '../../../models/v2/User.js'
import { User } from '../../../types/v2/types.js'

export const Roles = {
  Admin: 'admin',
}
export type RoleKeys = (typeof Roles)[keyof typeof Roles]

export abstract class BaseAuthenticationConnector {
  abstract getUserFromReq(req: Request): Promise<User>
  abstract hasRole(user: UserDoc, role: RoleKeys): Promise<boolean>

  abstract queryEntities(query: string): Promise<Array<{ kind: string; entities: Array<string> }>>
  abstract getEntities(user: UserDoc): Promise<Array<string>>
  abstract getUserInformation(userEntity: string): Promise<{ email: string }>
  abstract getEntityMembers(entity: string): Promise<Array<string>>

  async getUserInformationList(entity): Promise<Promise<{ email: string }>[]> {
    const entities = await this.getEntityMembers(entity)
    return entities.map((member) => this.getUserInformation(member))
  }
  async getUserModelRoles(user: UserDoc, model: ModelDoc) {
    const entities = await this.getEntities(user)

    return model.collaborators
      .filter((collaborator) => entities.includes(collaborator.entity))
      .map((collaborator) => collaborator.roles)
      .flat()
  }
}
