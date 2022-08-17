import { User, Model, Deployment, Version } from '../../types/interfaces.js'
import { Request } from 'express'
import { DeploymentDoc } from '../models/Deployment.js'
import { UserDoc } from '../models/User.js'
import { VersionDoc } from '../models/Version.js'

export default class AuthorisationBase {
  constructor() {}

  async getUserFromReq(req: Request) {
    const userId = req.get('x-userid')
    const email = req.get('x-email')
    const data = JSON.parse(req.get('x-user') ?? '{}')

    return {
      userId,
      email,
      data,
    }
  }

  async canUserSeeModel(_user: UserDoc, _model: Model) {
    return true
  }

  async canUserSeeVersion(_user: UserDoc, _model: VersionDoc) {
    return true
  }

  async canUserSeeDeployment(_user: UserDoc, _deployment: DeploymentDoc) {
    return true
  }
}
