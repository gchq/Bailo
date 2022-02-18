import { User, Model, Deployment } from "../../types/interfaces";
import { Request } from "express";

export default class AuthorisationBase {
  constructor() {

  }

  async getUserFromReq(req: Request) {
    // this function must never fail to call next, even when
    // no user is found.
    const userId = req.get('x-userid')
    const email = req.get('x-email')

    return {
      userId,
      email
    }
  }

  async canUserSeeModel(_user: User, _model: Model) {
    return true
  }

  async canUserSeeDeployment(_user: User, _deployment: Deployment) {
    return true
  }
}