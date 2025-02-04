import bodyParser from 'body-parser'
import { createHash, X509Certificate } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { readFile } from 'fs/promises'
import jwt, { SignOptions } from 'jsonwebtoken'
import { stringify as uuidStringify, v4 as uuidv4 } from 'uuid'

import audit from '../../connectors/audit/index.js'
import { Response as AuthResponse } from '../../connectors/authorisation/base.js'
import authorisation from '../../connectors/authorisation/index.js'
import { ModelDoc } from '../../models/Model.js'
import { UserInterface } from '../../models/User.js'
import log from '../../services/log.js'
import { getModelById } from '../../services/model.js'
import config from '../../utils/config.js'
import { Forbidden, Unauthorised } from '../../utils/result.js'
import { getUserFromAuthHeader } from '../../utils/user.js'
import { bailoErrorGuard } from './../middleware/expressErrorHandler.js'

let adminToken: string | undefined

export async function getAdminToken() {
  if (!adminToken) {
    const key = await getPrivateKey()
    const hash = createHash('sha256').update(key).digest().slice(0, 16)
    // eslint-disable-next-line no-bitwise
    hash[6] = (hash[6] & 0x0f) | 0x40
    // eslint-disable-next-line no-bitwise
    hash[8] = (hash[8] & 0x3f) | 0x80

    adminToken = uuidStringify(hash)
  }

  return adminToken
}

async function getPrivateKey() {
  return readFile(config.app.privateKey, { encoding: 'utf-8' })
}

async function getPublicKey() {
  return readFile(config.app.publicKey, { encoding: 'utf-8' })
}

function getBit(buffer: Buffer, index: number) {
  // eslint-disable-next-line no-bitwise
  const byte = ~~(index / 8)
  const bit = index % 8
  const idByte = buffer[byte]
  // eslint-disable-next-line no-bitwise
  return Number((idByte & (2 ** (7 - bit))) !== 0)
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function formatKid(keyBuffer: Buffer) {
  const bitLength = keyBuffer.length * 8

  if (bitLength % 40 !== 0) {
    throw new Error('Invalid bitLength provided, expected multiple of 40')
  }

  let output = ''
  for (let i = 0; i < bitLength; i += 5) {
    let idx = 0
    for (let j = 0; j < 5; j += 1) {
      // eslint-disable-next-line no-bitwise
      idx <<= 1
      idx += getBit(keyBuffer, i + j)
    }
    output += alphabet[idx]
  }

  const match = output.match(/.{1,4}/g)
  if (match === null) {
    throw new Error('KeyBuffer format failed, match did not find any sections.')
  }

  return match.join(':')
}

export async function getKid() {
  const cert = new X509Certificate(await getPublicKey())
  const der = cert.publicKey.export({ format: 'der', type: 'spki' })
  const hash = createHash('sha256').update(der).digest().slice(0, 30)

  return formatKid(hash)
}

async function encodeToken<T extends object>(data: T, { expiresIn }: { expiresIn: string }) {
  const privateKey = await getPrivateKey()

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
        kid: await getKid(),
        alg: 'RS256',
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

async function checkAccess(access: Access, user: UserInterface): Promise<AuthResponse> {
  const modelId = access.name.split('/')[0]
  let model: ModelDoc
  try {
    model = await getModelById(user, modelId)
  } catch (e) {
    log.warn({ userDn: user.dn, access, e }, 'Bad modelId provided')
    // bad model id?
    return { id: modelId, success: false, info: 'Bad modelId provided' }
  }

  const auth = await authorisation.image(user, model, access)
  return auth
}

export const getDockerRegistryAuth = [
  bodyParser.urlencoded({ extended: true }),
  async (req: Request, res: Response) => {
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
      return res.json({ token: refreshToken })
    }

    if (!scope) {
      // User requesting no scope, they're just trying to login
      // Because this token has no permissions, it is safe to
      // provide.
      return res.json({ token: await getAccessToken(user, []) })
    }

    let scopes: Array<string> = []

    if (Array.isArray(scope)) {
      scopes = scope as Array<string>
    } else if (typeof scope === 'string') {
      scopes = scope.split(' ')
    } else {
      throw Forbidden({ scope, typeOfScope: typeof scope }, 'Scope is an unexpected value', rlog)
    }

    const accesses = scopes.map(generateAccess)

    for (const access of accesses) {
      const authResult = await checkAccess(access, user)
      if (!admin && !authResult.success) {
        throw Forbidden({ access }, authResult.info, rlog)
      }
    }

    const accessToken = await getAccessToken(user, accesses)
    rlog.trace('Successfully generated access token')

    return res.json({ token: accessToken })
  },
  async (err: unknown, req: Request, res: Response, _next: NextFunction) => {
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

    return res.status(err.code).json({
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
