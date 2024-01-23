import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider'
import parser from 'body-parser'
import MongoStore from 'connect-mongo'
import { NextFunction, Request, Response, Router } from 'express'
import session from 'express-session'
import grant from 'grant'

import { UserDoc } from '../../../models/v2/User.js'
import config from '../../../utils/v2/config.js'
import { fromEntity, toEntity } from '../../../utils/v2/entity.js'
import { BaseAuthenticationConnector, RoleKeys, Roles, UserInformation } from './Base.js'

const SillyEntityKind = {
  User: 'user',
  Group: 'group',
} as const

export class OauthAuthenticationConnector extends BaseAuthenticationConnector {
  constructor() {
    super()
  }

  authenticationMiddleware() {
    return [
      {
        middleware: [
          session({
            secret: config.session.secret,
            resave: true,
            saveUninitialized: true,
            cookie: { maxAge: 30 * 24 * 60 * 60000 }, // store for 30 days
            store: MongoStore.create({
              mongoUrl: config.mongo.uri,
            }),
          }),
          parser.urlencoded({ extended: true }),
          grant.default.express(config.oauth.grant),
          this.getRoutes(),
        ],
      },
      {
        path: '/api/v2',
        middleware: [this.getUser],
      },
      ...super.authenticationMiddleware(),
    ]
  }

  getUser(req: Request, res: Response, next: NextFunction) {
    // this function must never fail to call next, even when
    // no user is found.
    if (!req.session.grant?.response?.jwt) {
      req.user = undefined
    } else {
      const jwt = req.session.grant.response.jwt
      req.user = {
        dn: jwt.id_token.payload.email,
      }
    }
    return next()
  }

  getRoutes() {
    const router = Router()
    router.get('/api/login', (req, res) => {
      res.redirect(`/api/connect/${config.oauth.provider}/login`)
    })

    router.get('/api/logout', (req, res) => {
      req.session.destroy(function (err: unknown) {
        if (err) throw err
        res.redirect('/')
      })
    })
    return router
  }

  async hasRole(_user: UserDoc, role: RoleKeys) {
    if (role === Roles.Admin) {
      return true
    }
    return false
  }

  async queryEntities(query: string) {
    const results = await this.listUsers(query)
    const mapped = results.Users?.map((user) => ({
      kind: SillyEntityKind.User,
      id: user.Attributes?.find((attribute) => attribute.Name === 'email')?.Value,
    }))
    //console.log(results.Users)
    return mapped
  }

  /**
   * Make this into a client function queryEmails that returns an array of emails
   * Handle errors like missing userpool Id
   */
  async listUsers(query: string) {
    const client = new CognitoIdentityProviderClient(config.oauth.cognito.CognitoIdentityProviderClient)

    const command = new ListUsersCommand({
      UserPoolId: config.oauth.cognito.userPoolId,
      Filter: `"email"^="${query}"`,
      AttributesToGet: ['email'],
    })

    const result = await client.send(command)
    return result
  }

  async getEntities(user: UserDoc) {
    return [toEntity(SillyEntityKind.User, user.dn)]
  }

  async getUserInformation(entity: string): Promise<UserInformation> {
    const { kind, value } = fromEntity(entity)

    if (kind !== SillyEntityKind.User) {
      throw new Error(`Cannot get user information for a non-user entity: ${entity}`)
    }

    return {
      email: `${value}@example.com`,
      name: 'Joe Bloggs',
      organisation: 'Acme Corp',
    }
  }

  async getEntityMembers(entity: string): Promise<string[]> {
    const { kind } = fromEntity(entity)
    switch (kind) {
      case SillyEntityKind.User:
        return [entity]
      case SillyEntityKind.Group:
        return [toEntity(SillyEntityKind.User, 'user'), toEntity(SillyEntityKind.User, 'user2')]
      default:
        throw new Error(`Unable to get members, entity kind not recognised: ${entity}`)
    }
  }
}
