import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { FileInterfaceDoc } from '../../../models/v2/File.js'
import { ModelDoc, ModelVisibility } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { SchemaDoc } from '../../../models/v2/Schema.js'
import { UserDoc } from '../../../models/v2/User.js'
import { Access, Action } from '../../../routes/v1/registryAuth.js'
import { getAccessRequestsByModel } from '../../../services/v2/accessRequest.js'
import { Roles } from '../authentication/Base.js'
import authentication from '../authentication/index.js'

export const ModelAction = {
  Create: 'create',
  View: 'view',
  Update: 'update',
  Write: 'write',
} as const
export type ModelActionKeys = (typeof ModelAction)[keyof typeof ModelAction]

export const ReleaseAction = {
  Create: 'create',
  View: 'view',
  Delete: 'delete',
  Update: 'update',
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

export const FileAction = {
  Delete: 'delete',
  Upload: 'upload',
  // 'view' refers to the ability to see metadata about the file.  'download' lets the user view the file contents.
  View: 'view',
  Download: 'download',
}
export type FileActionKeys = (typeof FileAction)[keyof typeof FileAction]

export const ImageAction = {
  Pull: 'pull',
  Push: 'push',
  List: 'list',
}
export type ImageActionKeys = (typeof ImageAction)[keyof typeof ImageAction]

type Response = { success: true; info: undefined } | { success: false; info: string }

export class BaseAuthorisationConnector {
  async hasModelVisibilityAccess(user: UserDoc, model: ModelDoc) {
    if (model.visibility === ModelVisibility.Public) {
      return true
    }

    const roles = await authentication.getUserModelRoles(user, model)
    if (roles.length === 0) return false

    return true
  }

  async hasAccessRequest(user: UserDoc, model: ModelDoc) {
    const entities = await authentication.getEntities(user)

    const accessRequests = await getAccessRequestsByModel(user, model.id)
    const hasAccessRequest = accessRequests.some((request) =>
      request.metadata.overview.entities.some((entity) => entities.includes(entity)),
    )

    return hasAccessRequest
  }

  async model(user: UserDoc, model: ModelDoc, action: ModelActionKeys) {
    return (await this.modelBatch(user, [model], action))[0]
  }

  async schema(user: UserDoc, schema: SchemaDoc, action: SchemaActionKeys) {
    return (await this.schemaBatch(user, [schema], action))[0]
  }

  async release(user: UserDoc, model: ModelDoc, release: ReleaseDoc, action: ReleaseActionKeys) {
    return (await this.releaseBatch(user, model, [release], action))[0]
  }

  async accessRequest(
    user: UserDoc,
    model: ModelDoc,
    accessRequest: AccessRequestDoc,
    action: AccessRequestActionKeys,
  ) {
    return (await this.accessRequestBatch(user, model, [accessRequest], action))[0]
  }

  async file(user: UserDoc, model: ModelDoc, file: FileInterfaceDoc, action: FileActionKeys) {
    return (await this.fileBatch(user, model, [file], action))[0]
  }

  async image(user: UserDoc, model: ModelDoc, access: Access) {
    return (await this.imageBatch(user, model, [access]))[0]
  }

  async modelBatch(user: UserDoc, models: Array<ModelDoc>, action: ModelActionKeys): Promise<Array<Response>> {
    return Promise.all(
      models.map(async (model) => {
        const roles = await authentication.getUserModelRoles(user, model)

        // Prohibit non-collaborators from seeing private models
        if (!(await this.hasModelVisibilityAccess(user, model))) {
          return { success: false, info: 'You cannot interact with a private model that you do not have access to.' }
        }

        // Check a user has a role before allowing write actions
        if ([ModelAction.Write, ModelAction.Update].some((a) => a === action) && roles.length === 0) {
          return { success: false, info: 'You cannot update a model you do not have permissions for.' }
        }

        return { success: true }
      }),
    )
  }

  async schemaBatch(user: UserDoc, schemas: Array<SchemaDoc>, action: SchemaActionKeys): Promise<Array<Response>> {
    if (action === SchemaAction.Create) {
      const isAdmin = await authentication.hasRole(user, Roles.Admin)

      if (!isAdmin) {
        return new Array(schemas.length).fill({
          success: false,
          info: 'You cannot upload a schema if you are not an admin.',
        })
      }
    }

    return new Array(schemas.length).fill({ success: true })
  }

  async releaseBatch(
    user: UserDoc,
    model: ModelDoc,
    _releases: Array<ReleaseDoc>,
    action: ReleaseActionKeys,
  ): Promise<Array<Response>> {
    // We don't have any specific roles dedicated to releases, so we pass it through to the model authorisation checker.
    // We do need to map some actions to other model actions.
    const actionMap: Record<ReleaseActionKeys, ModelActionKeys> = {
      [ReleaseAction.Create]: ModelAction.Write,
      [ReleaseAction.Delete]: ModelAction.Write,
      [ReleaseAction.Update]: ModelAction.Update,
      [ReleaseAction.View]: ModelAction.View,
    }

    return this.modelBatch(user, [model], actionMap[action])
  }

  async accessRequestBatch(
    user: UserDoc,
    model: ModelDoc,
    accessRequests: Array<AccessRequestDoc>,
    action: AccessRequestActionKeys,
  ): Promise<Array<Response>> {
    const entities = await authentication.getEntities(user)

    // Does the user hold a role on the model the parent is on?
    const hasModelRole = (await authentication.getUserModelRoles(user, model)).length !== 0

    return Promise.all(
      accessRequests.map(async (request) => {
        // Does any individual in the access request share an entity with our user?
        const isNamed = request.metadata.overview.entities.some((value) => entities.includes(value))

        // If they are not listed on the model
        if (!isNamed && !hasModelRole && [AccessRequestAction.Delete, AccessRequestAction.Update].includes(action)) {
          return { success: false, info: 'You cannot change an access request you do not own' }
        }

        // Otherwise they either own the model, access request or this is a read-only action.
        return { success: true }
      }),
    )
  }

  async fileBatch(
    user: UserDoc,
    model: ModelDoc,
    files: Array<FileInterfaceDoc>,
    action: FileActionKeys,
  ): Promise<Array<Response>> {
    // Does the user hold a role on the file's model?
    const hasModelRole = (await authentication.getUserModelRoles(user, model)).length !== 0

    // Does the user have a valid access request for this model?
    const hasAccessRequest = await this.hasAccessRequest(user, model)

    return Promise.all(
      files.map(async (_file) => {
        // If they are not listed on the model, don't let them upload or delete files.
        if (!hasModelRole && [FileAction.Delete, FileAction.Upload].includes(action)) {
          return { success: false, info: 'You need to hold a model role in order to upload a file' }
        }

        if (
          !hasAccessRequest &&
          !hasModelRole &&
          [FileAction.Download].includes(action) &&
          !model.settings.ungovernedAccess
        ) {
          return { success: false, info: 'You need to have a valid access request to download a file.' }
        }

        return { success: true }
      }),
    )
  }

  async imageBatch(user: UserDoc, model: ModelDoc, accesses: Array<Access>): Promise<Array<Response>> {
    // Does the user hold a role on the image's model?
    const hasModelRole = (await authentication.getUserModelRoles(user, model)).length !== 0

    // Does the user have a valid access request for this model?
    const hasAccessRequest = await this.hasAccessRequest(user, model)

    return Promise.all(
      accesses.map(async (access) => {
        // Don't allow anything beyond pushing and pulling actions.
        if (!access.actions.every((action) => [ImageAction.Push, ImageAction.Pull].includes(action))) {
          return {
            success: false,
            info: 'You are not allowed to complete any actions beyond `push` or `pull` on an image.',
          }
        }

        // If they are not listed on the model, don't let them upload or delete images.
        if (!hasModelRole && access.actions.includes(ImageAction.Push as Action)) {
          return { success: false, info: 'You need to hold a model role in order to upload an image' }
        }

        if (
          !hasAccessRequest &&
          !hasModelRole &&
          access.actions.includes(ImageAction.Pull as Action) &&
          !model.settings.ungovernedAccess
        ) {
          return { success: false, info: 'You need to have a valid access request to download an image.' }
        }

        return { success: true }
      }),
    )
  }
}
