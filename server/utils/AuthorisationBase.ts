import { User, Model, Deployment } from '../../types/interfaces'
import { Request } from 'express'

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

  async canUserSeeModel(_user: User, _model: Model) {
    return true
  }

  async canUserSeeDeployment(_user: User, _deployment: Deployment) {
    return true
  }
}
