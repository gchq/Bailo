import { Request } from 'express'

import { DeploymentDoc, ModelDoc, UserDoc, VersionDoc } from '../../types/types.js'
import { Model } from '../../types/types.js'

export default class AuthorisationOAuth {
  async getUserFromReq(req: Request) {
    if (!req.session?.grant?.response?.jwt) {
      return {
        userId: undefined,
        email: undefined,
        data: undefined,
        roles: undefined,
      }
    }

    const userId = req.session.grant.response.jwt.id_token.payload.email
    const email = userId

    const data = {}
    const roles = ['user']

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
