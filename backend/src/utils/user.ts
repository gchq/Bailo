import { timingSafeEqual } from 'crypto'

import { TokenDoc } from '../models/Token.js'
import { UserInterface } from '../models/User.js'
import { bailoErrorGuard } from '../routes/middleware/expressErrorHandler.js'
import { getAdminToken } from '../routes/registryAuth.js'
import { getTokenFromAuthHeader } from '../services/v2/token.js'

function safelyCompareTokens(expected: string, actual: string) {
  // This is not constant time, which will allow a user to calculate the length
  // of the token.  However, the token is a uuidv4() of constant length, so this
  // is acceptable.
  if (expected.length !== actual.length) {
    return false
  }

  // This comparison must be safe against timing attacks
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    return false
  }

  return true
}

// This is an authentication function.  Take care whilst editing it.  Notes:
// - the password is not hashed, so comparisons _must_ be done in constant time
export async function getUserFromAuthHeader(
  header: string,
): Promise<{ error?: string; user?: UserInterface; admin?: boolean; token?: TokenDoc }> {
  const [method, code] = header.split(' ')

  if (method.toLowerCase() !== 'basic') {
    return { error: 'Incorrect authorization type' }
  }

  const [username, token] = Buffer.from(code, 'base64').toString('utf-8').split(':')

  if (!username || !token) {
    return { error: 'Username and password not provided' }
  }

  if (safelyCompareTokens(await getAdminToken(), token)) {
    return { user: { dn: '' }, admin: true }
  }

  let tokenDoc: TokenDoc | undefined = undefined
  try {
    tokenDoc = await getTokenFromAuthHeader(header)
  } catch (e: unknown) {
    if (bailoErrorGuard(e) && e.code) {
      return { error: e.message }
    } else {
      throw e
    }
  }

  if (!tokenDoc) {
    return { error: 'No user found' }
  }

  return {
    token: tokenDoc,
    user: {
      dn: tokenDoc.user,
    },
  }
}
