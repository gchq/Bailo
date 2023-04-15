import bodyParser from 'body-parser'
import { createHash, X509Certificate } from 'crypto'
import { Request, Response } from 'express'
import { readFile } from 'fs/promises'
import jwt from 'jsonwebtoken'
import { isEqual } from 'lodash-es'
import { stringify as uuidStringify, v4 as uuidv4 } from 'uuid'

import { findDeploymentByUuid } from '../../services/deployment.js'
import { ModelId } from '../../types/types.js'
import config from '../../utils/config.js'
import { isUserInEntityList } from '../../utils/entity.js'
import logger from '../../utils/logger.js'
import { Forbidden } from '../../utils/result.js'
import { getUserFromAuthHeader } from '../../utils/user.js'

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

async function getKid() {
  const cert = new X509Certificate(await getPublicKey())
  const der = cert.publicKey.export({ format: 'der', type: 'spki' })
  const hash = createHash('sha256').update(der).digest().slice(0, 30)

  return formatKid(hash)
}

async function encodeToken(data: any, { expiresIn }: { expiresIn: string }) {
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
    }
  )
}

export function getRefreshToken(user: any) {
  return encodeToken(
    {
      sub: user.id,
      user: String(user._id),
      usage: 'refresh_token',
    },
    {
      expiresIn: '30 days',
    }
  )
}

export type Action = 'push' | 'pull' | 'delete' | '*'

export interface Access {
  type: string
  name: string
  class?: string
  actions: Array<Action>
}

export interface User {
  _id: ModelId
  id: string
}

export function getAccessToken(user: User, access: Array<Access>) {
  return encodeToken(
    {
      sub: user.id,
      user: String(user._id),
      access,
    },
    {
      expiresIn: '1 hour',
    }
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

async function checkAccess(access: Access, user: any) {
  if (access.type !== 'repository') {
    // not a repository request
    return false
  }

  const deploymentUuid = access.name.split('/')[0]
  const deployment = await findDeploymentByUuid(user, deploymentUuid)

  if (!deployment) {
    // no deployment found
    return false
  }

  if (!(await isUserInEntityList(user, deployment.metadata.contacts.owner))) {
    // user not in access list
    return false
  }

  if (!isEqual(access.actions, ['pull'])) {
    // users should only be able to pull images
    return false
  }

  return true
}

export const getDockerRegistryAuth = [
  bodyParser.urlencoded({ extended: true }),
  async (req: Request, res: Response) => {
    const { account, client_id: clientId, offline_token: offlineToken, service, scope } = req.query
    const isOfflineToken = offlineToken === 'true'

    let rlog = logger.child({ account, clientId, isOfflineToken, service, scope })
    rlog.trace({ url: req.originalUrl }, 'Received docker registry authentication request')

    const authorization = req.get('authorization')

    if (!authorization) {
      throw Forbidden({}, 'No authorisation header found', rlog)
    }

    const { error, user, admin } = await getUserFromAuthHeader(authorization)

    if (error) {
      throw Forbidden({ error }, error, rlog)
    }

    if (!user) {
      throw Forbidden({}, 'User authentication failed', rlog)
    }

    rlog = rlog.child({ user })

    if (service !== config.registry.service) {
      throw Forbidden(
        { expectedService: config.registry.service },
        'Received registry auth request from unexpected service',
        rlog
      )
    }

    if (isOfflineToken) {
      const refreshToken = await getRefreshToken(user)
      rlog.trace('Successfully generated offline token')
      return res.json({ token: refreshToken })
    }

    if (!scope) {
      throw Forbidden({}, 'Undefined scope', rlog)
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
      if (!admin && !(await checkAccess(access, user))) {
        throw Forbidden({ access }, 'User does not have permission to carry out request', rlog)
      }
    }

    const token = await getAccessToken(user, accesses)
    rlog.trace('Successfully generated access token')

    return res.json({ token })
  },
]
