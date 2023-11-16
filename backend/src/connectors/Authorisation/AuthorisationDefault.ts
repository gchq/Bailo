import { Request } from 'express'

import { DeploymentDoc, ModelDoc, UserDoc, VersionDoc } from '../../types/types.js'
import { Model } from '../../types/types.js'

export default class AuthorisationDefault {
  async getUserFromReq(req: Request) {
    console.log('We got a request coming in on URL', req.originalUrl)
    console.log('The user object is', req.get('x-user'))
    console.log('The roles object is', req.get('x-roles'))

    console.log(JSON.stringify(req.get('x-user')))

    console.log('value here is', req.get('x-user') ?? '{}')
    console.log('value of roles is', req.get('x-roles') ?? '["user", "admin"]')

    const userId = 'user'
    const email = 'user@example.com'

    console.log('We successfully got the user and email address')

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
