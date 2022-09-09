import { Request } from 'express'
import { Model } from '../../types/interfaces'
import { DeploymentDoc } from '../models/Deployment'
import { UserDoc } from '../models/User'
import { VersionDoc } from '../models/Version'

export default class AuthorisationBase {
  static async getUserFromReq(req: Request) {
    const userId = req.get('x-userid')
    const email = req.get('x-email')
    const data = JSON.parse(req.get('x-user') ?? '{}')

    return {
      userId,
      email,
      data,
    }
  }

  static async canUserSeeModel(_user: UserDoc, _model: Model) {
    return true
  }

  static async canUserSeeVersion(_user: UserDoc, _model: VersionDoc) {
    return true
  }

  static async canUserSeeDeployment(_user: UserDoc, _deployment: DeploymentDoc) {
    return true
  }
}
