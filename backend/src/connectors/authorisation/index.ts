import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
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
      throw ConfigurationError(`'${config.connectors.authorisation.kind}' is not a valid authorisation kind.`, {
        validKinds: Object.values(AuthorisationKind),
      })
  }

  return authorisationConnector
}

export default getAuthorisationConnector()
