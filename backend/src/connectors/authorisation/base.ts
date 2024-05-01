import { AccessRequestDoc } from '../../models/AccessRequest.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { EntryVisibility, ModelDoc } from '../../models/Model.js'
import { ReleaseDoc } from '../../models/Release.js'
import { SchemaDoc } from '../../models/Schema.js'
import { UserInterface } from '../../models/User.js'
import { Access, Action } from '../../routes/v1/registryAuth.js'
import { getModelAccessRequestsForUser } from '../../services/accessRequest.js'
import { checkAccessRequestsApproved } from '../../services/review.js'
import { Roles } from '../authentication/Base.js'
import authentication from '../authentication/index.js'
import {
  AccessRequestAction,
  AccessRequestActionKeys,
  FileAction,
  FileActionKeys,
  ImageAction,
  ModelAction,
  ModelActionKeys,
  ReleaseAction,
  ReleaseActionKeys,
  SchemaAction,
  SchemaActionKeys,
} from './actions.js'

type Response = { id: string; success: true } | { id: string; success: false; info: string }

export class BasicAuthorisationConnector {
  async hasModelVisibilityAccess(user: UserInterface, model: ModelDoc) {
    if (model.visibility === EntryVisibility.Public) {
      return true
    }

    const roles = await authentication.getUserModelRoles(user, model)
    if (roles.length === 0) return false

    return true
  }

  async hasApprovedAccessRequest(user: UserInterface, model: ModelDoc) {
    const accessRequests = await getModelAccessRequestsForUser(user, model.id)
    if (accessRequests.length === 0) {
      return false
    }
    return await checkAccessRequestsApproved(accessRequests.map((accessRequest) => accessRequest.id))
  }

  async model(user: UserInterface, model: ModelDoc, action: ModelActionKeys) {
    return (await this.models(user, [model], action))[0]
  }

  async schema(user: UserInterface, schema: SchemaDoc, action: SchemaActionKeys) {
    return (await this.schemas(user, [schema], action))[0]
  }

  async release(user: UserInterface, model: ModelDoc, release: ReleaseDoc, action: ReleaseActionKeys) {
    return (await this.releases(user, model, [release], action))[0]
  }

  async accessRequest(
    user: UserInterface,
    model: ModelDoc,
    accessRequest: AccessRequestDoc,
    action: AccessRequestActionKeys,
  ) {
    return (await this.accessRequests(user, model, [accessRequest], action))[0]
  }

  async file(user: UserInterface, model: ModelDoc, file: FileInterfaceDoc, action: FileActionKeys) {
    return (await this.files(user, model, [file], action))[0]
  }

  async image(user: UserInterface, model: ModelDoc, access: Access) {
    return (await this.images(user, model, [access]))[0]
  }

  async models(user: UserInterface, models: Array<ModelDoc>, action: ModelActionKeys): Promise<Array<Response>> {
    return Promise.all(
      models.map(async (model) => {
        // Prohibit non-collaborators from seeing private models
        if (!(await this.hasModelVisibilityAccess(user, model))) {
          return {
            id: model.id,
            success: false,
            info: 'You cannot interact with a private model that you do not have access to.',
          }
        }

        // Check a user has a role before allowing write actions
        if (
          [ModelAction.Write, ModelAction.Update].some((a) => a === action) &&
          (await missingRequiredRole(user, model, ['owner', 'collaborator']))
        ) {
          return { id: model.id, success: false, info: 'Only owners and collaborators can update a model.' }
        }

        return { id: model.id, success: true }
      }),
    )
  }

  async schemas(user: UserInterface, schemas: Array<SchemaDoc>, action: SchemaActionKeys): Promise<Array<Response>> {
    if (action === SchemaAction.Create || action === SchemaAction.Delete) {
      const isAdmin = await authentication.hasRole(user, Roles.Admin)

      if (!isAdmin) {
        return schemas.map((schema) => ({
          id: schema.id,
          success: false,
          info: 'You cannot upload or modify a schema if you are not an admin.',
        }))
      }
    }

    return schemas.map((schema) => ({
      id: schema.id,
      success: true,
    }))
  }

  async releases(
    user: UserInterface,
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
    user: UserInterface,
    model: ModelDoc,
    accessRequests: Array<AccessRequestDoc>,
    action: AccessRequestActionKeys,
  ): Promise<Array<Response>> {
    const entities = await authentication.getEntities(user)

    return Promise.all(
      accessRequests.map(async (request) => {
        // Does any individual in the access request share an entity with our user?
        const isNamed = request.metadata.overview.entities.some((value) => entities.includes(value))

        /**
         * Reject if:
         *  - user is not named on the access request
         *  - user is not the owner of the model
         *  - the user is trying to delete or update an existing AR
         */
        if (
          !isNamed &&
          (await missingRequiredRole(user, model, ['owner'])) &&
          [AccessRequestAction.Delete, AccessRequestAction.Update].includes(action)
        ) {
          return { success: false, info: 'You cannot change an access request you do not own', id: request.id }
        }

        // Otherwise they either own the model, access request or this is a read-only action.
        return { success: true, id: request.id }
      }),
    )
  }

  async files(
    user: UserInterface,
    model: ModelDoc,
    files: Array<FileInterfaceDoc>,
    action: FileActionKeys,
  ): Promise<Array<Response>> {
    // Does the user have a valid access request for this model?
    const hasApprovedAccessRequest = await this.hasApprovedAccessRequest(user, model)

    return Promise.all(
      files.map(async (file) => {
        // If they are not listed on the model, don't let them upload or delete files.
        if (
          [FileAction.Delete, FileAction.Upload].includes(action) &&
          (await missingRequiredRole(user, model, ['owner', 'collaborator']))
        ) {
          return {
            success: false,
            info: 'You need to be an owner or collaborator in order to upload a file',
            id: file.id,
          }
        }

        if (
          [FileAction.Download].includes(action) &&
          !model.settings.ungovernedAccess &&
          !hasApprovedAccessRequest &&
          (await missingRequiredRole(user, model, ['owner', 'collaborator', 'consumer']))
        ) {
          return {
            success: false,
            info: 'You need to have an approved access request or be an owner, collaborator or consumer to download a file.',
            id: file.id,
          }
        }

        return { success: true, id: file.id }
      }),
    )
  }

  async images(user: UserInterface, model: ModelDoc, accesses: Array<Access>): Promise<Array<Response>> {
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
        if (
          (await missingRequiredRole(user, model, ['owner', 'collaborator'])) &&
          access.actions.includes(ImageAction.Push as Action)
        ) {
          return {
            success: false,
            info: 'You need to be an owner or collaborator in order to upload an image',
            id: access.name,
          }
        }

        if (
          !hasAccessRequest &&
          (await missingRequiredRole(user, model, ['owner', 'collaborator', 'consumer'])) &&
          access.actions.includes(ImageAction.Pull as Action) &&
          !model.settings.ungovernedAccess
        ) {
          return {
            success: false,
            info: 'You need to have an approved access request or be an owner, collaborator or consumer to download an image.',
            id: access.name,
          }
        }

        return { success: true, id: access.name }
      }),
    )
  }
}

async function missingRequiredRole(user: UserInterface, model: ModelDoc, roles: Array<string>) {
  const modelRoles = await authentication.getUserModelRoles(user, model)
  return !modelRoles.some((value) => roles.includes(value))
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
