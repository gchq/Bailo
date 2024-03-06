import { customAlphabet } from 'nanoid'

import { TokenActionsKeys, TokenDoc, TokenScopeKeys } from '../models/Token.js'
import Token from '../models/Token.js'
import { UserInterface } from '../models/User.js'
import { BadReq, Forbidden, NotFound, Unauthorized } from '../utils/error.js'
import { getModelById } from './model.js'

interface CreateTokenProps {
  description: string

  scope: TokenScopeKeys
  modelIds: Array<string>
  actions: Array<TokenActionsKeys>
}

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQSRTUVWXYZ')
export async function createToken(user: UserInterface, { description, scope, modelIds, actions }: CreateTokenProps) {
  const accessKey = `BAC_${nanoid(8)}`
  const secretKey = `BSK_${nanoid(12)}`

  if (scope === 'models') {
    // Checks to make sure the models are valid
    for (const modelId of modelIds) {
      await getModelById(user, modelId)
    }
  }

  const token = new Token({
    user: user.dn,
    description,

    scope,
    modelIds,
    actions,

    accessKey,
    secretKey,
  })

  await token.save()

  token.secretKey = secretKey
  return token
}

export async function findUserTokens(user: UserInterface) {
  return Token.find({
    user: user.dn,
  })
}

export async function removeToken(user: UserInterface, accessKey: string) {
  const token = await findTokenByAccessKey(accessKey)

  if (token.user !== user.dn) {
    throw Forbidden('Only the token owner can remove the token', { accessKey })
  }

  await token.remove()

  return { success: true }
}

interface GetTokenOptions {
  includeSecretKey?: boolean
}

export async function findTokenByAccessKey(accessKey: string, opts?: GetTokenOptions) {
  let query = Token.findOne({
    accessKey,
  })

  if (opts?.includeSecretKey) {
    query = query.select('+secretKey')
  }

  const token = await query

  if (!token) {
    throw NotFound('Could not find token', { accessKey })
  }

  return token
}

export async function getTokenFromAuthHeader(header: string) {
  // NOTE: This is a security function.  Care should be taking when editting this function.
  // Any pull requests that alter this MUST be checked out by at least two other people
  // familiar with the codebase.
  const [method, code] = header.split(' ')

  if (method.toLowerCase() !== 'basic') {
    throw BadReq(`Incorrect authorization type, should be 'basic'`, { method })
  }

  const [accessKey, secretKey] = Buffer.from(code, 'base64').toString('utf-8').split(':')

  if (!accessKey || !secretKey) {
    // We're explicitly not providing context here, because the error may be logged and
    // logs should not include access keys / secret keys.
    throw BadReq(`Access key and secret key were not provided.`)
  }

  const token = await findTokenByAccessKey(accessKey, { includeSecretKey: true })
  if (!(await token.compareToken(secretKey))) {
    throw Unauthorized('Invalid secret key', { accessKey })
  }

  return token
}

export async function validateTokenForModel(token: TokenDoc, modelId: string, action: TokenActionsKeys) {
  if (token.scope === 'models' && !token.modelIds.includes(modelId)) {
    throw Unauthorized('This token may not be used for this model', {
      accessKey: token.accessKey,
      modelIds: token.modelIds,
      modelId,
    })
  }

  if (!token.actions.includes(action)) {
    throw Unauthorized('This token may not be used for this action', {
      accessKey: token.accessKey,
      actions: token.actions,
      action,
    })
  }

  return
}
