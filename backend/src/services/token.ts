import { customAlphabet } from 'nanoid'

import { Response } from '../connectors/authorisation/base.js'
import { TokenActionsKeys, TokenDoc, TokenScope, TokenScopeKeys } from '../models/Token.js'
import Token from '../models/Token.js'
import { UserInterface } from '../models/User.js'
import { BadReq, Forbidden, NotFound, Unauthorized } from '../utils/error.js'
import { getModelById } from './model.js'

interface CreateTokenProps {
  description: string

  scope: TokenScopeKeys
  modelIds: Array<string>
  actions: Array<string>
}

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQSRTUVWXYZ')
export async function createToken(user: UserInterface, { description, scope, modelIds, actions }: CreateTokenProps) {
  if (user.token) {
    // Prevent escalating token privileges
    throw Forbidden('A token cannot be used to create another token', { accessKey: user.token.accessKey })
  }

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

export async function validateTokenForUse(token: TokenDoc | undefined, action: TokenActionsKeys): Promise<Response> {
  if (!token) {
    // User session comes without restrictions
    return {
      id: action,
      success: true,
    }
  }

  if (token.scope === TokenScope.Models) {
    return {
      id: token._id,
      success: false,
      info: 'This token must not have model restrictions for this endpoint',
    }
  }

  if (token.actions && !token.actions.includes(action)) {
    return {
      id: token._id,
      success: false,
      info: 'This token may not be used for this action',
    }
  }

  return {
    id: token._id,
    success: true,
  }
}

export async function validateTokenForModel(
  token: TokenDoc | undefined,
  modelId: string,
  action: TokenActionsKeys,
): Promise<Response> {
  if (!token) {
    // User session comes without restrictions
    return {
      id: modelId,
      success: true,
    }
  }

  if (token.scope === TokenScope.Models && !token.modelIds.includes(modelId)) {
    return {
      id: modelId,
      success: false,
      info: 'This token may not be used for this model',
    }
  }

  if (token.actions && !token.actions.includes(action)) {
    return {
      id: modelId,
      success: false,
      info: `This token is missing the required action: ${action}`,
    }
  }

  return {
    id: modelId,
    success: true,
  }
}
