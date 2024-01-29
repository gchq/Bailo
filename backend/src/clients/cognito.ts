import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider'

import { UserInformation } from '../connectors/v2/authentication/Base.js'
import config from '../utils/v2/config.js'
import { ConfigurationError, InternalError } from '../utils/v2/error.js'

export async function listUsers(query: string, exactMatch = false) {
  let dnName: string
  let userPoolId: string
  try {
    dnName = config.oauth.cognito.userIdAttribute
    userPoolId = config.oauth.cognito.userPoolId
  } catch (e) {
    throw ConfigurationError('Cannot find userIdAttribute in oauth configuration', { oauthConfiguration: config.oauth })
  }
  const client = new CognitoIdentityProviderClient(config.oauth.cognito.identityProviderClient)

  const command = new ListUsersCommand({
    UserPoolId: userPoolId,
    Filter: exactMatch ? `"${dnName}"="${query}"` : `"${dnName}"^="${query}"`,
  })

  let results: ListUsersCommandOutput
  try {
    results = await client.send(command)
  } catch (err) {
    throw InternalError('Error when querying Cognito for users.', { err })
  }
  if (!results.Users) {
    return []
  }

  const initialValue: Array<UserInformation & { dn: string }> = []
  const users = results.Users.reduce((acc, cognitoUser) => {
    const dn = cognitoUser.Attributes?.find((attribute) => attribute.Name === dnName)?.Value
    if (!dn) {
      return acc
    }
    const info: UserInformation = {
      email: cognitoUser.Attributes?.find((attribute) => attribute.Name === 'email')?.Value,
    }
    acc.push({ ...info, dn })
    return acc
  }, initialValue)
  return users
}
