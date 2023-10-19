import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { ModelDoc, ModelVisibility } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { UserDoc } from '../../../models/v2/User.js'

export const ModelAction = {
  Create: 'create',
  View: 'view',
  Update: 'update',
  DeleteFile: 'delete_file',
  UploadFile: 'upload_file',
  Write: 'write',
} as const
export type ModelActionKeys = (typeof ModelAction)[keyof typeof ModelAction]

export const ReleaseAction = {
  Create: 'create',
  View: 'view',
  Delete: 'delete',
}
export type ReleaseActionKeys = (typeof ReleaseAction)[keyof typeof ReleaseAction]

export const AccessRequestAction = {
  Create: 'create',
  View: 'view',
  Update: 'update',
  Delete: 'delete',
}
export type AccessRequestActionKeys = (typeof ReleaseAction)[keyof typeof ReleaseAction]

export abstract class BaseAuthorisationConnector {
  abstract userModelAction(user: UserDoc, model: ModelDoc, action: ModelActionKeys): Promise<boolean>
  abstract userReleaseAction(
    user: UserDoc,
    model: ModelDoc,
    release: ReleaseDoc,
    action: ReleaseActionKeys,
  ): Promise<boolean>
  abstract userAccessRequestAction(
    user: UserDoc,
    model: ModelDoc,
    accessRequest: AccessRequestDoc,
    action: AccessRequestActionKeys,
  )
  abstract getEntities(user: UserDoc): Promise<Array<string>>
  abstract getUserInformation(userEntity: string): Promise<{ email: string }>
  abstract getEntityMembers(entity: string): Promise<Array<string>>

  async getUserInformationList(entity): Promise<Promise<{ email: string }>[]> {
    const entities = await this.getEntityMembers(entity)
    return entities.map((member) => this.getUserInformation(member))
  }

  async hasModelVisibilityAccess(user: UserDoc, model: ModelDoc) {
    if (model.visibility === ModelVisibility.Public) {
      return true
    }

    const roles = await this.getUserModelRoles(user, model)
    if (roles.length === 0) return false

    return true
  }

  async getUserModelRoles(user: UserDoc, model: ModelDoc) {
    const entities = await this.getEntities(user)

    return model.collaborators
      .filter((collaborator) => entities.includes(collaborator.entity))
      .map((collaborator) => collaborator.roles)
      .flat()
  }
}
