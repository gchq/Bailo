import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { ModelDoc, ModelVisibility } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { SchemaDoc } from '../../../models/v2/Schema.js'
import { UserDoc } from '../../../models/v2/User.js'
import authentication from '../authentication/index.js'

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
export type AccessRequestActionKeys = (typeof AccessRequestAction)[keyof typeof AccessRequestAction]

export const SchemaAction = {
  Create: 'create',
}
export type SchemaActionKeys = (typeof SchemaAction)[keyof typeof SchemaAction]

export abstract class BaseAuthorisationConnector {
  abstract userModelAction(user: UserDoc, model: ModelDoc, action: ModelActionKeys): Promise<boolean>
  abstract userSchemaAction(user: UserDoc, Schema: SchemaDoc, action: SchemaActionKeys): Promise<boolean>
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
  ): Promise<boolean>

  async hasModelVisibilityAccess(user: UserDoc, model: ModelDoc) {
    if (model.visibility === ModelVisibility.Public) {
      return true
    }

    const roles = await authentication.getUserModelRoles(user, model)
    if (roles.length === 0) return false

    return true
  }
}
