import bodyParser from 'body-parser'
import { createHash, X509Certificate } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { readFile } from 'fs/promises'
import jwt, { SignOptions } from 'jsonwebtoken'
import type { StringValue } from 'ms'
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

let adminToken: string | undefined

// Similar to the MongoDB soft-delete plugin, specify the prefix for any deleted image names
export const softDeletePrefix = 'soft_deleted/'

export async function getAdminToken() {
  if (!adminToken) {
    const key = await getPrivateKey()
    const hash = createHash('sha256').update(key).digest().slice(0, 16)
    hash[6] = (hash[6] & 0x0f) | 0x40
    hash[8] = (hash[8] & 0x3f) | 0x80

    adminToken = uuidStringify(hash)
  }

  return adminToken
}

async function getPrivateKey() {
  return readFile(config.app.privateKey, { encoding: 'utf-8' })
}

async function encodeToken<T extends object>(data: T, { expiresIn }: { expiresIn: StringValue }) {
  const privateKey = await getPrivateKey()
  const cert = new X509Certificate(await getPublicKey())

  return jwt.sign(
    {
      ...data,
      jti: uuidv4(),
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn,

      audience: config.registry.service,
      issuer: config.registry.issuer,

      header: {
        kid: await getKid(cert),
        alg: 'RS256',
        // The registry >=3.0.0-beta.1 image requires the (typically optional) x5c header
        x5c: [cert.raw.toString('base64')],
      },
    } as SignOptions,
  )
}

export function getRefreshToken(user: UserInterface) {
  return encodeToken(
    {
      sub: user.dn,
      user: String(user.dn),
      usage: 'refresh_token',
    },
    {
      expiresIn: '30 days',
    },
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

export function getAccessToken(user: UserInterface, access: Array<Access>) {
  return encodeToken(
    {
      sub: user.dn,
      user: String(user.dn),
      access,
    },
    {
      expiresIn: '1 hour',
    },
  )
}

function generateAccess(scope: any) {
  const [typ, repository, actionString] = scope.split(':')
  const actions = actionString.split(',')

  return {
    type: typ,
    name: repository,
    actions,
  }
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
  if (model.kind == EntryKind.MirroredModel && !isReadOnlyAccessRequestActions(access.actions, true)) {
    return {
      id: modelId,
      success: false,
      info: 'You are not allowed to complete any actions beyond `pull` or `list` on an image associated with a mirrored model.',
    }
  }

  return await authorisation.image(user, model, access, admin)
}

function isReadOnlyAccessRequestActions(actions: Action[], includeWildCard: boolean = false) {
  return actions.some((action) => (['pull', 'list', ...(includeWildCard ? ['*'] : [])] as Action[]).includes(action))
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
      const refreshToken = await getRefreshToken(user)
      rlog.trace('Successfully generated offline token')
      res.json({ token: refreshToken })
      return
    }

    if (!scope) {
      // User requesting no scope, they're just trying to login
      // Because this token has no permissions, it is safe to
      // provide.
      res.json({ token: await getAccessToken(user, []) })
      return
    }

    let scopes: Array<string> = []

    if (Array.isArray(scope)) {
      scopes = scope as Array<string>
    } else if (typeof scope === 'string') {
      scopes = scope.split(' ')
    } else {
      throw Forbidden({ scope, typeOfScope: typeof scope }, 'Scope is an unexpected value', rlog)
    }

    const requestedAccesses = scopes.map(generateAccess)
    const grantedAccesses: Access[] = []

    for (const access of requestedAccesses) {
      const authResult = await checkAccess(access, user, admin)
      if (!authResult.success) {
        // Ignore unauthorised read-only scopes (containerd cross-mount)
        if (isReadOnlyAccessRequestActions(access.actions)) {
          rlog.debug({ access }, 'Ignoring unauthorised scope.')
          continue
        }

        throw Forbidden({ access }, authResult.info, rlog)
      }

      grantedAccesses.push({
        ...access,
        actions: access.actions,
      })
    }

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

    const accessToken = await getAccessToken(user, grantedAccesses)
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
