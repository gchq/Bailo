import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { FileInterfaceDoc } from '../../../models/v2/File.js'
import { ModelDoc, ModelVisibility } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { SchemaDoc } from '../../../models/v2/Schema.js'
import { UserDoc } from '../../../models/v2/User.js'
import { Access, Action } from '../../../routes/v1/registryAuth.js'
import { getModelAccessRequestsForUser } from '../../../services/v2/accessRequest.js'
import { checkAccessRequestsApproved } from '../../../services/v2/review.js'
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
  Delete: 'delete',
  Update: 'update',
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

type Response = { id: string; success: true } | { id: string; success: false; info: string }

export class BasicAuthorisationConnector {
  async hasModelVisibilityAccess(user: UserDoc, model: ModelDoc) {
    if (model.visibility === ModelVisibility.Public) {
      return true
    }

    const roles = await authentication.getUserModelRoles(user, model)
    if (roles.length === 0) return false

    return true
  }

  async hasApprovedAccessRequest(user: UserDoc, model: ModelDoc) {
    const accessRequests = await getModelAccessRequestsForUser(user, model.id)
    if (accessRequests.length === 0) {
      return false
    }
    return await checkAccessRequestsApproved(accessRequests.map((accessRequest) => accessRequest.id))
  }

  async model(user: UserDoc, model: ModelDoc, action: ModelActionKeys) {
    return (await this.models(user, [model], action))[0]
  }

  async schema(user: UserDoc, schema: SchemaDoc, action: SchemaActionKeys) {
    return (await this.schemas(user, [schema], action))[0]
  }

  async release(user: UserDoc, model: ModelDoc, release: ReleaseDoc, action: ReleaseActionKeys) {
    return (await this.releases(user, model, [release], action))[0]
  }

  async accessRequest(
    user: UserDoc,
    model: ModelDoc,
    accessRequest: AccessRequestDoc,
    action: AccessRequestActionKeys,
  ) {
    return (await this.accessRequests(user, model, [accessRequest], action))[0]
  }

  async file(user: UserDoc, model: ModelDoc, file: FileInterfaceDoc, action: FileActionKeys) {
    return (await this.files(user, model, [file], action))[0]
  }

  async image(user: UserDoc, model: ModelDoc, access: Access) {
    return (await this.images(user, model, [access]))[0]
  }

  async models(user: UserDoc, models: Array<ModelDoc>, action: ModelActionKeys): Promise<Array<Response>> {
    return Promise.all(
      models.map(async (model) => {
        const roles = await authentication.getUserModelRoles(user, model)

        // Prohibit non-collaborators from seeing private models
        if (!(await this.hasModelVisibilityAccess(user, model))) {
          return {
            id: model.id,
            success: false,
            info: 'You cannot interact with a private model that you do not have access to.',
          }
        }

        // Check a user has a role before allowing write actions
        if ([ModelAction.Write, ModelAction.Update].some((a) => a === action) && roles.length === 0) {
          return { id: model.id, success: false, info: 'You cannot update a model you do not have permissions for.' }
        }

        return { id: model.id, success: true }
      }),
    )
  }

  async schemas(user: UserDoc, schemas: Array<SchemaDoc>, action: SchemaActionKeys): Promise<Array<Response>> {
    if (action === SchemaAction.Create) {
      const isAdmin = await authentication.hasRole(user, Roles.Admin)

      if (!isAdmin) {
        return schemas.map((schema) => ({
          id: schema.id,
          success: false,
          info: 'You cannot upload or modify a schema if you are not an admin.',
        }))
      }
    }

    if (action === SchemaAction.Delete) {
      const isAdmin = await authentication.hasRole(user, Roles.Admin)

      if (!isAdmin) {
        return schemas.map((schema) => ({
          id: schema.id,
          success: false,
          info: 'You cannot delete a schema if you are not an admin.',
        }))
      }
    }

    return schemas.map((schema) => ({
      id: schema.id,
      success: true,
    }))
  }

  async releases(
    user: UserDoc,
    model: ModelDoc,
    releases: Array<ReleaseDoc>,
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

    return new Array(releases.length).fill(await this.model(user, model, actionMap[action]))
  }

  async accessRequests(
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
          return { success: false, info: 'You cannot change an access request you do not own', id: request.id }
        }

        // Otherwise they either own the model, access request or this is a read-only action.
        return { success: true, id: request.id }
      }),
    )
  }

  async files(
    user: UserDoc,
    model: ModelDoc,
    files: Array<FileInterfaceDoc>,
    action: FileActionKeys,
  ): Promise<Array<Response>> {
    // Does the user hold a role on the file's model?
    const hasModelRole = (await authentication.getUserModelRoles(user, model)).length !== 0

    // Does the user have a valid access request for this model?
    const hasApprovedAccessRequest = await this.hasApprovedAccessRequest(user, model)

    return Promise.all(
      files.map(async (file) => {
        // If they are not listed on the model, don't let them upload or delete files.
        if (!hasModelRole && [FileAction.Delete, FileAction.Upload].includes(action)) {
          return { success: false, info: 'You need to hold a model role in order to upload a file', id: file.id }
        }

        if (
          !hasApprovedAccessRequest &&
          !hasModelRole &&
          [FileAction.Download].includes(action) &&
          !model.settings.ungovernedAccess
        ) {
          return {
            success: false,
            info: 'You need to have an approved access request to download a file.',
            id: file.id,
          }
        }

        return { success: true, id: file.id }
      }),
    )
  }

  async images(user: UserDoc, model: ModelDoc, accesses: Array<Access>): Promise<Array<Response>> {
    // Does the user hold a role on the image's model?
    const hasModelRole = (await authentication.getUserModelRoles(user, model)).length !== 0

    // Does the user have a valid access request for this model?
    const hasAccessRequest = await this.hasApprovedAccessRequest(user, model)

    return Promise.all(
      accesses.map(async (access) => {
        // Don't allow anything beyond pushing and pulling actions.
        if (
          !access.actions.every((action) => [ImageAction.Push, ImageAction.Pull, ImageAction.List].includes(action))
        ) {
          return {
            success: false,
            info: 'You are not allowed to complete any actions beyond `push` or `pull` on an image.',
            id: access.name,
          }
        }

        // If they are not listed on the model, don't let them upload or delete images.
        if (!hasModelRole && access.actions.includes(ImageAction.Push as Action)) {
          return { success: false, info: 'You need to hold a model role in order to upload an image', id: access.name }
        }

        if (
          !hasAccessRequest &&
          !hasModelRole &&
          access.actions.includes(ImageAction.Pull as Action) &&
          !model.settings.ungovernedAccess
        ) {
          return {
            success: false,
            info: 'You need to have an approved access request to download an image.',
            id: access.name,
          }
        }

        return { success: true, id: access.name }
      }),
    )
  }
}

export async function partials<T>(
  data: Array<T>,
  responses: Array<Response>,
  func: (items: Array<T>) => Array<Response>,
): Promise<Array<Response>> {
  const items = data.filter((_, i) => responses[i].success)
  const newResponses = await Promise.resolve(func(items))

  if (newResponses.length !== items.length) {
    throw new Error('The function did not return a response for every item.')
  }

  let responsesIndex = 0
  const mergedResponses = responses.map((response) => {
    if (response.success) {
      return newResponses[responsesIndex++]
    }

    return response
  })

  return mergedResponses
}
