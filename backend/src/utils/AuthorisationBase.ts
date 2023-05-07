import { Request } from 'express'

import { DeploymentDoc, ModelDoc, UserDoc, VersionDoc } from '../types/types.js'
import { Model } from '../types/types.js'
import { BadReq } from './result.js'

export default class AuthorisationBase {
  async getUserFromReq(req: Request) {
    if (req.query.userId && typeof req.query.userId !== 'string') {
      throw BadReq({ userId: req.query.userId }, 'Bad type for userId')
    }

    if (req.query.email && typeof req.query.email !== 'string') {
      throw BadReq({ email: req.query.email }, 'Bad type for email')
    }

    const userId = req.query.userId || 'user'
    const email = req.query.email || 'user@example.com'
    const data = JSON.parse(req.get('x-user') ?? '{}')
    const roles = JSON.parse(req.get('x-roles') ?? '["user", "admin"]')

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
