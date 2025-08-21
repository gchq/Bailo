import { RequestHandler } from 'express'

import { UserInterface } from '../../models/User.js'
import { checkAuthentication, getTokenFromAuthHeader } from '../../routes/middleware/defaultAuthentication.js'

export const Roles = {
  Admin: 'admin',
} as const
export type RoleKeys = (typeof Roles)[keyof typeof Roles]

export interface UserInformation {
  name?: string
  organisation?: string
  email?: string
}

export abstract class BaseAuthenticationConnector {
  abstract hasRole(user: UserInterface, role: RoleKeys): Promise<boolean>

  abstract queryEntities(query: string): Promise<Array<{ kind: string; id: string }>>
  abstract getEntities(user: UserInterface): Promise<Array<string>>
  abstract getUserInformation(userEntity: string): Promise<UserInformation>
  abstract getEntityMembers(entity: string): Promise<Array<string>>

  async getUserInformationList(entity: string): Promise<UserInformation[]> {
    const entities = await this.getEntityMembers(entity)
    return Promise.all(entities.map((member) => this.getUserInformation(member)))
  }

  authenticationMiddleware(): Array<{ path?: string; middleware: Array<RequestHandler> }> {
    return [
      {
        path: '/api/v2/token',
        middleware: [getTokenFromAuthHeader],
      },
      {
        path: '/api/v2',
        middleware: [getTokenFromAuthHeader, checkAuthentication],
      },
    ]
  }
}
