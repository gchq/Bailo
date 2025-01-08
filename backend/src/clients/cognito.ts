import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider'

import { UserInformation } from '../connectors/authentication/Base.js'
import log from '../services/log.js'
import config from '../utils/config.js'
import { ConfigurationError, InternalError } from '../utils/error.js'

export async function listUsers(query: string, exactMatch = false) {
  let dnName: string
  let userPoolId: string
  try {
    dnName = config.oauth.cognito.userIdAttribute
    userPoolId = config.oauth.cognito.userPoolId
  } catch (err) {
    log.error(err)
    throw ConfigurationError('Cannot find userIdAttribute in oauth configuration', { oauthConfiguration: config.oauth })
  }

  let client: CognitoIdentityProviderClient
  if (
    config.oauth.cognito.identityProviderClient.credentials.accessKeyId &&
    config.oauth.cognito.identityProviderClient.credentials.secretAccessKey
  ) {
    client = new CognitoIdentityProviderClient(config.oauth.cognito.identityProviderClient)
  } else {
    client = new CognitoIdentityProviderClient()
  }

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
    const email = cognitoUser.Attributes?.find((attribute) => attribute.Name === 'email')?.Value
    const name = cognitoUser.Attributes?.find((attribute) => attribute.Name === 'given_name')?.Value
    const info: UserInformation = {
      ...(email && { email }),
      ...(name && { name }),
    }
    acc.push({ ...info, dn })
    return acc
  }, initialValue)
  return users
}
