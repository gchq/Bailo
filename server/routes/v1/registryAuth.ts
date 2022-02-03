import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { X509Certificate, createHash } from 'crypto'
import { readFile } from 'fs/promises'
import bodyParser from 'body-parser'
import config from 'config'
import { v4 as uuidv4, stringify as uuidStringify } from 'uuid'
import logger from '../../utils/logger'
import isEqual from 'lodash/isEqual'
import { getUserFromAuthHeader } from '../../utils/user'

let adminToken: string | undefined = undefined

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
// On startup get admin token
getAdminToken()

async function getPrivateKey() {
  return await readFile('./certs/key.pem', { encoding: 'utf-8' })
}

async function getPublicKey() {
  return await readFile('./certs/cert.pem', { encoding: 'utf-8' })
}

function getBit(buffer: Buffer, index: number) {
  const byte = ~~(index / 8)
  const bit = index % 8
  const idByte = buffer[byte]
  return Number((idByte & Math.pow(2, 7 - bit)) !== 0)
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function formatKid(keyBuffer: Buffer) {
  const bitLength = keyBuffer.length * 8

  if (bitLength % 40 !== 0) {
    throw new Error('Invalid bitlength provided, expected multiple of 40')
  }

  let output = ''
  for (let i = 0; i < bitLength; i += 5) {
    let idx = 0
    for (let j = 0; j < 5; j++) {
      idx <<= 1
      idx += getBit(keyBuffer, i + j)
    }
    output += alphabet[idx]
  }

  return output.match(/.{1,4}/g)!.join(':')
}

async function getKid() {
  const cert = new X509Certificate(await getPublicKey())
  const der = cert.publicKey.export({ format: 'der', type: 'spki' })
  const hash = createHash('sha256').update(der).digest().slice(0, 30)
  const kid = formatKid(hash)

  return kid
}

async function encodeToken(data, { expiresIn }) {
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

      audience: config.get('registry.service'),
      issuer: config.get('registry.issuer'),

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

export function getAccessToken(user, access) {
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

function checkAccess(access, user) {
  if (access.type !== 'repository') {
    // not a repository request
    return false
  }

  if (!access.name.startsWith(`${user.id}/`)) {
    // not users deployment area
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
    rlog.info({ url: req.originalUrl }, 'Received docker registry authentication request')

    const authorization = req.get('authorization')

    if (!authorization) {
      rlog.warn('No authorization header found')
      return res.status(403).json({
        message: 'no authorization header found',
      })
    }

    const { error, user, admin } = await getUserFromAuthHeader(authorization)

    if (error) {
      rlog.warn({ error }, 'User authentication failed')
      return res.status(403).json({
        message: error,
      })
    }

    if (!user) {
      rlog.warn('User authentication failed')
      return res.status(403).json({
        message: 'user authentication failed',
      })
    }

    rlog = rlog.child({ user })

    if (service !== config.get('registry.service')) {
      rlog.warn(
        { expectedService: config.get('registry.service') },
        'Received registry auth request from unexpected service'
      )
      return res.status(403).json({
        message: 'invalid service',
      })
    }

    if (isOfflineToken) {
      const token = await getRefreshToken(user)
      rlog.info('Successfully generated offline token')
      return res.json({ token })
    }

    if (!scope) {
      rlog.warn('Scope is undefined')
      return res.status(403).json({
        message: 'undefined scope',
      })
    }

    let scopes: Array<string> = []

    if (Array.isArray(scope)) {
      scopes = scope as Array<string>
    } else if (typeof scope === 'string') {
      scopes = scope.split(' ')
    } else {
      rlog.warn({ scope, typeOfScope: typeof scope }, 'Scope is an unexpected value')
      return res.status(403).json({
        message: 'unexpected scope type',
      })
    }

    const accesses = scopes.map(generateAccess)

    for (let access of accesses) {
      if (!admin && !checkAccess(access, user)) {
        rlog.warn({ access }, 'User does not have permission to carry out request')
        return res.status(403).json({
          message: 'invalid access',
        })
      }
    }

    const token = await getAccessToken(user, accesses)
    rlog.info('Successfully generated access token')

    return res.json({ token })
  },
]
