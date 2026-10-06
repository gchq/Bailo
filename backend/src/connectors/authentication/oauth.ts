import MongoStore from 'connect-mongo'
import { NextFunction, Request, Response, Router } from 'express'
import session from 'express-session'
import grant from 'grant'

import { getGroupMembership, listUsers } from '../../clients/cognito.js'
import { UserInterface } from '../../models/User.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { getConnectionURI } from '../../utils/database.js'
import { fromEntity, toEntity } from '../../utils/entity.js'
import { InternalError, NotFound } from '../../utils/error.js'
import { BaseAuthenticationConnector } from './Base.js'
import { RoleKeys, Roles, UserInformation } from './constants.js'

const OauthEntityKind = {
  User: 'user',
  Group: 'group',
} as const

// Redirect users to the Market Place if the callback is unsafe cross origin ect.
const defaultLoginRedirect = '/'

function getSafeLoginRedirect(redirect: unknown): string {
  if (typeof redirect !== 'string') {
    return defaultLoginRedirect
  }

  if (!redirect.startsWith('/')) {
    return defaultLoginRedirect
  }

  try {
    const decodedPath = decodeURIComponent(redirect.split(/[?#]/, 1)[0]) // Normalise encoded paths
    if (
      decodedPath.startsWith('//') || // Double path
      decodedPath.includes('\\') || // Backslash
      /[\r\n]/.test(decodedPath) || // Newline
      decodedPath.split('/').some((segment) => segment === '.' || segment === '..') // Path traversal
    ) {
      return defaultLoginRedirect
    }

    const baseUrl = new URL(
      `${config.app.protocol || 'http'}://${config.app.host || 'localhost'}${config.app.port ? `:${config.app.port}` : ''}`,
    )
    const redirectUrl = new URL(redirect, baseUrl)

    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`
  } catch {
    return defaultLoginRedirect
  }
}

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
              mongoUrl: getConnectionURI(),
            }),
          }),
          grant.default.express(config.oauth.grant),
          this.getRoutes(),
        ],
      },
      {
        path: '/api/v2',
        middleware: [this.getUser],
      },
      {
        path: '/api/v3',
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
      req.session.loginRedirect = getSafeLoginRedirect(req.query.redirect)
      res.redirect(`/api/connect/${config.oauth.provider}/login`)
    })

    router.get('/api/login/callback', (req, res) => {
      const redirect = getSafeLoginRedirect(req.session.loginRedirect)
      delete req.session.loginRedirect
      res.redirect(redirect)
    })

    router.get('/api/logout', (req, res) => {
      req.session.destroy(function (err: unknown) {
        if (err) {
          throw err
        }
        res.redirect('/')
      })
    })
    return router
  }

  private async hasGroupMembership(user: UserInterface, groupName: string): Promise<boolean> {
    if (!groupName) {
      log.warn({ groupName }, 'Group name not configured, returning false for group check.')
      return false
    }
    const members = await this.getEntityMembers(toEntity(OauthEntityKind.Group, groupName))
    return members.includes(user.dn)
  }

  async hasRole(user: UserInterface, role: RoleKeys): Promise<boolean> {
    const isAdmin = await this.hasGroupMembership(user, config.oauth.cognito.adminGroupName)

    if (isAdmin) {
      return true
    }

    switch (role) {
      case Roles.Compliance:
        return this.hasGroupMembership(user, config.oauth.cognito.complianceGroupName)

      case Roles.UntrustedModel:
        return this.hasGroupMembership(user, config.oauth.cognito.untrustedModelGroupName)

      default:
        return false
    }
  }

  async queryEntities(query: string) {
    const entities = (await listUsers(query)).map((info) => ({ kind: OauthEntityKind.User, id: info.dn }))
    return entities
  }

  async getEntities(user: UserInterface) {
    return [toEntity(OauthEntityKind.User, user.dn)]
  }

  async getUserInformation(entity: string): Promise<UserInformation> {
    const { kind, value: dn } = fromEntity(entity)

    if (kind !== OauthEntityKind.User) {
      throw new Error(`Cannot get user information for a non-user entity: ${entity}`)
    }

    const users = await listUsers(dn, true)
    if (users.length > 1) {
      throw InternalError('Cannot get user information. Found more than one user.', { entity, lookupResult: users })
    }
    if (users.length === 0) {
      throw NotFound('Cannot get user information. User not found.', { entity })
    }
    const { dn: _returnedDn, ...info } = users[0]
    return info
  }

  async getEntityMembers(entity: string): Promise<string[]> {
    const { kind, value } = fromEntity(entity)
    switch (kind) {
      case OauthEntityKind.User:
        return [entity]
      case OauthEntityKind.Group:
        return await getGroupMembership(value)
      default:
        throw new Error(`Unable to get members, entity kind not recognised: ${entity}`)
    }
  }
}
