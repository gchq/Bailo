import config from '../../../utils/v2/config.js'
import { ConfigurationError } from '../../../utils/v2/error.js'
import { BasicAuthorisationConnector } from './base.js'

export const AuthorisationKind = {
  Basic: 'basic',
} as const
export type AuthorisationKindKeys = (typeof AuthorisationKind)[keyof typeof AuthorisationKind]

let authorisationConnector: undefined | BasicAuthorisationConnector = undefined
export function getAuthorisationConnector(cache = true): BasicAuthorisationConnector {
  if (authorisationConnector && cache) {
    return authorisationConnector
  }

  switch (config.connectors.authorisation.kind) {
    case AuthorisationKind.Basic:
      authorisationConnector = new BasicAuthorisationConnector()
      break
    default:
      throw ConfigurationError(`'${config.connectors.authentication.kind}' is not a valid Authorisation kind.`, {
        validKinds: Object.values(AuthorisationKind),
      })
  }

  return authorisationConnector
}

export default getAuthorisationConnector()
