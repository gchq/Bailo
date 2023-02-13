import { Request } from 'express'
import { ModelDoc } from '../models/Model.js'
import { Model } from '../../types/interfaces.js'
import { DeploymentDoc } from '../models/Deployment.js'
import { UserDoc } from '../models/User.js'
import { VersionDoc } from '../models/Version.js'

export default class AuthorisationBase {
  async getUserFromReq(req: Request) {
    const userId = req.get('x-userid')
    const email = req.get('x-email')
    const data = JSON.parse(req.get('x-user') ?? '{}')
    const roles = JSON.parse(req.get('x-roles') ?? '["user"]')

    return {
      userId,
      email,
      data,
      roles,
    }
  }

  async canUserSeeModel(_user: UserDoc, _model: Model | ModelDoc) {
    return true
  }

  async canUserSeeVersion(_user: UserDoc, _model: VersionDoc) {
    return true
  }

  async canUserSeeDeployment(_user: UserDoc, _deployment: DeploymentDoc) {
    return true
  }
}
