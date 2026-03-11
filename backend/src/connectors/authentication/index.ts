import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseAuthenticationConnector } from './Base.js'
import { OauthAuthenticationConnector } from './oauth.js'
import { SillyAuthenticationConnector } from './silly.js'

export const AuthenticationKind = {
  Silly: 'silly',
  Oauth: 'oauth',
} as const
export type AuthenticationKindKeys = (typeof AuthenticationKind)[keyof typeof AuthenticationKind]

let authenticationConnector: undefined | BaseAuthenticationConnector = undefined
export function getAuthenticationConnector(cache = true) {
  if (authenticationConnector && cache) {
    return authenticationConnector
  }

  switch (config.connectors.authentication.kind) {
    case AuthenticationKind.Silly:
      authenticationConnector = new SillyAuthenticationConnector()
      break
    case AuthenticationKind.Oauth:
      authenticationConnector = new OauthAuthenticationConnector()
      break
    default:
      throw ConfigurationError(`'${config.connectors.authentication.kind}' is not a valid authentication kind.`, {
        validKinds: Object.values(AuthenticationKind),
      })
  }

  return authenticationConnector
}

export default getAuthenticationConnector()
