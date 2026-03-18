import bodyParser from 'body-parser'
import { createHash, X509Certificate } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { readFile } from 'fs/promises'
import jwt, { SignOptions } from 'jsonwebtoken'
import type { StringValue } from 'ms'
import NodeCache from 'node-cache'
import { stringify as uuidStringify, v4 as uuidv4 } from 'uuid'

import audit from '../../connectors/audit/index.js'
import { Response as AuthResponse } from '../../connectors/authorisation/base.js'
import authorisation from '../../connectors/authorisation/index.js'
import { EntryKind, EntryKindKeys, ModelDoc } from '../../models/Model.js'
import { UserInterface } from '../../models/User.js'
import log from '../../services/log.js'
import { getModelById } from '../../services/model.js'
import config from '../../utils/config.js'
import { getKid, getPublicKey } from '../../utils/registryUtils.js'
import { Forbidden, Unauthorised } from '../../utils/result.js'
import { getUserFromAuthHeader } from '../../utils/user.js'
import { bailoErrorGuard } from './../middleware/expressErrorHandler.js'

const JWT_ALGORITHM: jwt.Algorithm = 'RS256'
const ACCESS_TOKEN_TTL: StringValue = '1 hour'
const REFRESH_TOKEN_TTL: StringValue = '30 days'
const cryptoCache = new NodeCache({ useClones: false })

const READ_ONLY_ACTIONS = ['pull', 'list'] as const

// Similar to the MongoDB soft-delete plugin, specify the prefix for any deleted image names
export const softDeletePrefix = 'soft_deleted/'

export async function getAdminToken(): Promise<string> {
  const cached = cryptoCache.get<string>('adminToken')
  if (cached !== undefined) {
    return cached
  }

  const key = await getPrivateKey()
  const hash = createHash('sha256').update(key).digest().slice(0, 16)
  hash[6] = (hash[6] & 0x0f) | 0x40
  hash[8] = (hash[8] & 0x3f) | 0x80

  const adminToken = uuidStringify(hash)
  cryptoCache.set('adminToken', adminToken)

  return adminToken
}

async function getPrivateKey(): Promise<string> {
  const cached = cryptoCache.get<string>('privateKey')
  if (cached !== undefined) {
    return cached
  }

  const key = await readFile(config.app.privateKey, { encoding: 'utf-8' })
  cryptoCache.set('privateKey', key)

  return key
}

async function getCertificate(): Promise<X509Certificate> {
  const cached = cryptoCache.get<X509Certificate>('certificate')
  if (cached !== undefined) {
    return cached
  }

  const cert = new X509Certificate(await getPublicKey())
  cryptoCache.set('certificate', cert)

  return cert
}

async function getKeyId(): Promise<string> {
  const cached = cryptoCache.get<string>('kid')
  if (cached !== undefined) {
    return cached
  }
  const kid = await getKid(await getCertificate())
  cryptoCache.set('kid', kid)

  return kid
}

async function signJwt<T extends object>(payload: T, expiresIn: StringValue): Promise<string> {
  try {
    const [privateKey, cert, kid] = await Promise.all([getPrivateKey(), getCertificate(), getKeyId()])

    return jwt.sign(
      {
        ...payload,
        jti: uuidv4(),
      },
      privateKey,
      {
        algorithm: JWT_ALGORITHM,
        expiresIn,

        audience: config.registry.service,
        issuer: config.registry.issuer,

        header: {
          kid,
          alg: JWT_ALGORITHM,
          // The registry >=3.0.0-beta.1 image requires the (typically optional) x5c header
          x5c: [cert.raw.toString('base64')],
        },
      } as SignOptions,
    )
  } catch (err) {
    log.error({ err }, 'JWT signing failed')
    throw err
  }
}

export function issueRefreshToken(user: UserInterface): Promise<string> {
  return signJwt(
    {
      sub: user.dn,
      user: String(user.dn),
      usage: 'refresh_token',
    },
    REFRESH_TOKEN_TTL,
  )
}

export type Action = 'push' | 'pull' | 'delete' | '*' | 'list'

// Documented here: https://distribution.github.io/distribution/spec/auth/scope/
export interface Access {
  type: string
  name: string
  class?: string
  actions: Array<Action>
}

export function issueAccessToken(user: UserInterface, access: Array<Access>): Promise<string> {
  return signJwt(
    {
      sub: user.dn,
      user: String(user.dn),
      access,
    },
    ACCESS_TOKEN_TTL,
  )
}

// See https://distribution.github.io/distribution/spec/auth/scope/#resource-scope-grammar
export function parseResourceScope(input: string): Access[] {
  const accesses: Access[] = []

  // Split on spaces for multiple `resourcescope` entries
  const scopeParts = input.trim().split(/\s+/)

  /**
   * Full `resourcescope` regex
   *
   * Grammar mapping:
   *   resourcescope := resourcetype ":" resourcename ":" action [ "," action ]*
   */
  const re = new RegExp(
    '^' +
      // resourcetype
      //   resourcetype := resourcetypevalue [ "(" resourcetypevalue ")" ]
      //   resourcetypevalue := /[a-z0-9]+/
      '(?<type>[a-z0-9]+(?:\\([a-z0-9]+\\))?)' +
      ':' +
      // resourcename
      //   resourcename := [ hostname "/" ] component [ "/" component ]*
      '(?<name>' +
      // Optional hostname + "/"
      //   hostname := hostcomponent ("." hostcomponent)* [ ":" port-number ]
      '(?:' +
      '(?:' +
      // hostcomponent
      '(?:[a-zA-Z0-9]|' +
      '[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]' +
      ')' +
      ')' +
      '(?:\\.' +
      '(?:[a-zA-Z0-9]|' +
      '[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]' +
      ')' +
      ')*' +
      '(?::[0-9]+)?' +
      '/' +
      ')?' +
      // component
      //   component := alpha-numeric ( separator alpha-numeric )*
      //   alpha-numeric := /[a-z0-9]+/
      '[a-z0-9]+' +
      '(?:' +
      '(?:[_.]|__|-*)' +
      '[a-z0-9]+' +
      ')*' +
      // Additional "/component" segments
      '(?:/' +
      '[a-z0-9]+' +
      '(?:' +
      '(?:[_.]|__|-*)' +
      '[a-z0-9]+' +
      ')*' +
      ')*' +
      ')' +
      ':' +
      // actions
      //   action := /[a-z]*/
      //   Multiple actions are comma-separated
      '(?<actions>(?:\\*|[a-z]*)(?:,(?:\\*|[a-z]*))*)' +
      '$',
  )

  for (const part of scopeParts) {
    const match = re.exec(part)
    if (!match?.groups) {
      throw new Error(`Invalid resource scope: ${part}`)
    }

    // Split comma-separated actions
    const actions = match.groups.actions.split(',').filter((a) => a.length > 0) as Action[]

    accesses.push({
      type: match.groups.type,
      name: match.groups.name,
      actions,
    })
  }

  return accesses
}

export async function checkAccess(access: Access, user: UserInterface, admin?: boolean): Promise<AuthResponse> {
  if (access.name.startsWith(softDeletePrefix)) {
    const info = `Access name must not begin with soft delete prefix: ${softDeletePrefix}`
    log.warn({ userDn: user.dn, access }, info)
    return {
      id: access.name,
      success: false,
      info,
    }
  }

  if (!access.name.includes('/')) {
    const info = `ModelId not found.`
    log.warn({ userDn: user.dn, access }, info)
    return {
      id: access.name,
      success: false,
      info,
    }
  }

  const modelId = access.name.split('/')[0]
  let model: ModelDoc
  try {
    model = await getModelById(user, modelId)
  } catch (e) {
    log.warn({ userDn: user.dn, access, e }, 'ModelId not found.')
    return { id: modelId, success: false, info: 'ModelId not found.' }
  }

  // Check for disallowed entry types (i.e. non model types)
  if (!([EntryKind.Model, EntryKind.MirroredModel] as EntryKindKeys[]).includes(model.kind)) {
    return { id: modelId, success: false, info: `No registry use allowed on ${model.kind}.` }
  }

  // Further restrict mirrored model actions
  if (model.kind === EntryKind.MirroredModel && !isReadOnlyActions(access.actions, true)) {
    return {
      id: modelId,
      success: false,
      info: 'You are not allowed to complete any actions beyond `pull` or `list` on an image associated with a mirrored model.',
    }
  }

  return await authorisation.image(user, model, access, admin)
}

function isReadOnlyActions(actions: Action[], includeWildcard: boolean = false) {
  const allowed = includeWildcard ? [...READ_ONLY_ACTIONS, '*'] : READ_ONLY_ACTIONS
  return actions.every((action) => allowed.includes(action as any))
}

export const getDockerRegistryAuth = [
  bodyParser.urlencoded({ extended: true }),

  async (req: Request, res: Response): Promise<void> => {
    const { account, client_id: clientId, offline_token: offlineToken, service, scope } = req.query
    const isOfflineToken = offlineToken === 'true'

    let rlog = log.child({ account, clientId, isOfflineToken, service, scope })
    rlog.trace({ url: req.originalUrl }, 'Received docker registry authentication request')

    const authorization = req.get('authorization')

    if (!authorization) {
      throw Unauthorised({}, 'No authorisation header found', rlog)
    }

    const { error, user, admin } = await getUserFromAuthHeader(authorization)

    if (error) {
      throw Unauthorised({ error }, error, rlog)
    }

    if (!user) {
      throw Unauthorised({}, 'User authentication failed', rlog)
    }

    rlog = rlog.child({ user })

    if (service !== config.registry.service) {
      throw Unauthorised(
        { expectedService: config.registry.service },
        'Received registry auth request from unexpected service',
        rlog,
      )
    }

    if (isOfflineToken) {
      const refreshToken = await issueRefreshToken(user)
      rlog.trace('Successfully generated offline token')
      res.json({ token: refreshToken })
      return
    }

    if (!scope) {
      // User requesting no scope, they're just trying to login
      // Because this token has no permissions, it is safe to
      // provide.
      res.json({ token: await issueAccessToken(user, []) })
      return
    }

    const scopes = Array.isArray(scope) ? scope : typeof scope === 'string' ? scope.split(' ') : null

    if (!scopes || scopes.some((s) => typeof s !== 'string')) {
      throw Forbidden({ scope, typeOfScope: typeof scope }, 'Scope is an unexpected value', rlog)
    }

    const requestedAccesses: Access[] = []
    scopes.forEach((s) => {
      try {
        // force type as above filters out non-strings
        const parsed = parseResourceScope(s as string)
        requestedAccesses.push(...parsed)
      } catch {
        throw Forbidden({ scope: s }, 'Invalid scope format', rlog)
      }
    })

    const authResults = await Promise.all(requestedAccesses.map((a) => checkAccess(a, user, admin)))
    const grantedAccesses: Access[] = []

    authResults.forEach((result, idx) => {
      const access = requestedAccesses[idx]

      if (!result.success) {
        // Ignore unauthorised read-only scopes (containerd cross-mount)
        if (isReadOnlyActions(access.actions)) {
          rlog.debug({ access }, 'Ignoring unauthorised read-only scope')
          return
        }

        throw Forbidden({ access }, result.info, rlog)
      }

      grantedAccesses.push(access)
    })

    // Enforce non-empty write authorisation
    if (
      requestedAccesses.some((a) => a.actions.includes('push')) &&
      !grantedAccesses.some((a) => a.actions.includes('push'))
    ) {
      throw Forbidden({ requestedAccesses }, 'No authorised push scopes.', rlog)
    }

    // Enforce non-empty authorisation
    if (grantedAccesses.length === 0) {
      throw Forbidden({ requestedAccesses }, 'Requested image is not accessible - no authorised scopes.', rlog)
    }

    const accessToken = await issueAccessToken(user, grantedAccesses)
    rlog.trace('Successfully generated access token.')

    res.json({ token: accessToken })
  },

  async (err: unknown, req: Request, res: Response, _next: NextFunction): Promise<void> => {
    if (!bailoErrorGuard(err)) {
      log.error({ err }, 'No error code was found, returning generic error to user.')
      throw err
    }

    const logger = err.logger || req.log
    logger.warn(err.context, err.message)

    delete err.context?.internal

    await audit.onError(req, err)

    let dockerCode = 'UNKNOWN'
    switch (err.code) {
      case 401:
        dockerCode = 'UNAUTHORIZED'
        break
      case 403:
        dockerCode = 'DENIED'
    }

    res.status(err.code).json({
      errors: [
        {
          code: dockerCode,
          message: err.message,
          detail: err.context,
        },
      ],
    })
  },
]
