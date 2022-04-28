import { User, Model, Deployment, Version } from '../../types/interfaces'
import { Request } from 'express'
import { DeploymentDoc } from '../models/Deployment'
import { UserDoc } from '../models/User'
import { VersionDoc } from '../models/Version'

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
