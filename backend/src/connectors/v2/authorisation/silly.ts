import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { FileInterfaceDoc } from '../../../models/v2/File.js'
import { ModelDoc } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { SchemaDoc } from '../../../models/v2/Schema.js'
import { UserDoc } from '../../../models/v2/User.js'
import { Access } from '../../../routes/v1/registryAuth.js'
import { getAccessRequestsByModel } from '../../../services/v2/accessRequest.js'
import log from '../../../services/v2/log.js'
import { Roles } from '../authentication/Base.js'
import authentication from '../authentication/index.js'
import {
  AccessRequestActionKeys,
  BaseAuthorisationConnector,
  FileAction,
  FileActionKeys,
  ImageAction,
  ImageActionKeys,
  ModelActionKeys,
  ReleaseActionKeys,
  SchemaActionKeys,
} from './Base.js'

export class SillyAuthorisationConnector extends BaseAuthorisationConnector {
  constructor() {
    super()
  }

  async userModelAction(user: UserDoc, model: ModelDoc, _action: ModelActionKeys) {
    // Prohibit non-collaborators from seeing private models
    if (!(await this.hasModelVisibilityAccess(user, model))) {
      return false
    }

    // Allow any other action to be completed
    return true
  }

  async userReleaseAction(
    user: UserDoc,
    model: ModelDoc,
    _release: ReleaseDoc,
    _action: ReleaseActionKeys,
  ): Promise<boolean> {
    // Prohibit non-collaborators from seeing private models
    if (!(await this.hasModelVisibilityAccess(user, model))) {
      return false
    }

    // Allow any other action to be completed
    return true
  }

  async userAccessRequestAction(
    user: UserDoc,
    model: ModelDoc,
    _accessRequest: AccessRequestDoc,
    _action: AccessRequestActionKeys,
  ) {
    // Prohibit non-collaborators from seeing private models
    if (!(await this.hasModelVisibilityAccess(user, model))) {
      return false
    }

    // Allow any other action to be completed
    return true
  }

  async userFileAction(
    user: UserDoc,
    model: ModelDoc,
    file: FileInterfaceDoc,
    action: FileActionKeys,
  ): Promise<boolean> {
    // Prohibit non-collaborators from seeing private models
    if (!(await this.hasModelVisibilityAccess(user, model))) {
      return false
    }

    const entities = await authentication.getEntities(user)
    if (model.collaborators.some((collaborator) => entities.includes(collaborator.entity))) {
      // Collaborators can upload or download files
      return true
    }

    if (action !== FileAction.Download) {
      log.warn({ userDn: user.dn, file: file._id }, 'Non-collaborator can only download artefacts')
      return false
    }

    if (model.settings.ungovernedAccess) {
      return true
    }

    const accessRequests = await getAccessRequestsByModel(user, model.id)
    const accessRequest = accessRequests.find((accessRequest) =>
      accessRequest.metadata.overview.entities.some((entity) => entities.includes(entity)),
    )

    if (!accessRequest) {
      // User does not have a valid access request
      log.warn({ userDn: user.dn, file: file._id }, 'No valid access request found')
      return false
    }

    return true
  }

  async userImageAction(user: UserDoc, model: ModelDoc, access: Access, action: ImageActionKeys): Promise<boolean> {
    // Prohibit non-collaborators from seeing private models
    if (!(await this.hasModelVisibilityAccess(user, model))) {
      return false
    }

    const entities = await authentication.getEntities(user)
    if (model.collaborators.some((collaborator) => entities.includes(collaborator.entity))) {
      // Collaborators can upload or download files
      return true
    }

    if (action !== ImageAction.Pull) {
      log.warn({ userDn: user.dn, access }, 'Non-collaborator can only pull models')
      return false
    }

    if (model.settings.ungovernedAccess) {
      return true
    }

    const accessRequests = await getAccessRequestsByModel(user, model.id)
    const accessRequest = accessRequests.find((accessRequest) =>
      accessRequest.metadata.overview.entities.some((entity) => entities.includes(entity)),
    )

    if (!accessRequest) {
      // User does not have a valid access request
      log.warn({ userDn: user.dn, access }, 'No valid access request found')
      return false
    }

    return true
  }

  async userSchemaAction(user: UserDoc, _schema: SchemaDoc, _action: SchemaActionKeys) {
    return authentication.hasRole(user, Roles.Admin)
  }
}
