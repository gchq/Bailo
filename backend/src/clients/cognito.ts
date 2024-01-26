import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider'

import { UserInformation } from '../connectors/v2/authentication/Base.js'
import config from '../utils/v2/config.js'
/**
 * Make this into a client function queryEmails that returns an array of emails
 * Handle errors like missing userpool Id
 */
export async function listUsers(query: string) {
  const dnName = config.oauth.cognito.userIdAttribute
  const client = new CognitoIdentityProviderClient(config.oauth.cognito.identityProviderClient)

  const command = new ListUsersCommand({
    UserPoolId: config.oauth.cognito.userPoolId,
    Filter: `"${dnName}"^="${query}"`,
    //AttributesToGet: ['${config.oauth.cognito.userIdAttribute}'],
  })

  const results = await client.send(command)
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
