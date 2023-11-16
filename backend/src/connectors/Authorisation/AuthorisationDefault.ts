import { Request } from 'express'

import { DeploymentDoc, ModelDoc, UserDoc, VersionDoc } from '../../types/types.js'
import { Model } from '../../types/types.js'

export default class AuthorisationDefault {
  async getUserFromReq(_req: Request) {
    const userId = 'user'
    const email = 'user@example.com'
    const data = {}
    const roles = ['user', 'admin']

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
