import parser from 'body-parser'
import MongoStore from 'connect-mongo'
import { NextFunction, Request, Response, Router } from 'express'
import session from 'express-session'
import grant from 'grant'

import { listUsers } from '../../../clients/cognito.js'
import { UserDoc } from '../../../models/v2/User.js'
import config from '../../../utils/v2/config.js'
import { fromEntity, toEntity } from '../../../utils/v2/entity.js'
import { InternalError } from '../../../utils/v2/error.js'
import { BaseAuthenticationConnector, RoleKeys, UserInformation } from './Base.js'

const OauthEntityKind = {
  User: 'user',
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

  async hasRole(_user: UserDoc, _role: RoleKeys) {
    return false
  }

  async queryEntities(query: string) {
    const entities = (await listUsers(query)).map((info) => ({ kind: OauthEntityKind.User, id: info.dn }))
    return entities
  }

  async getEntities(user: UserDoc) {
    return [toEntity(OauthEntityKind.User, user.dn)]
  }

  async getUserInformation(entity: string): Promise<UserInformation> {
    const { kind, value: dn } = fromEntity(entity)

    if (kind !== OauthEntityKind.User) {
      throw new Error(`Cannot get user information for a non-user entity: ${entity}`)
    }

    const users = await listUsers(dn, true)
    if (users.length !== 1) {
      throw InternalError('Unable to find a single user.', { entity, lookupResult: users })
    }
    const { dn: _returnedDn, ...info } = users[0]
    return info
  }

  async getEntityMembers(entity: string): Promise<string[]> {
    const { kind } = fromEntity(entity)
    switch (kind) {
      case OauthEntityKind.User:
        return [entity]
      default:
        throw new Error(`Unable to get members, entity kind not recognised: ${entity}`)
    }
  }
}
