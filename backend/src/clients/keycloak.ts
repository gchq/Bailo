import { UserInformation } from '../connectors/authentication/Base.js'
import config from '../utils/config.js'
import { ConfigurationError, InternalError } from '../utils/error.js'

export async function listUsers(query: string, exactMatch = false) {
  let dnName: string
  let realm: string
  try {
    if (!config?.oauth?.keycloak) {
      throw ConfigurationError('OAuth Keycloak configuration is missing')
    }
    realm = config.oauth.keycloak.realm
  } catch (e) {
    throw ConfigurationError('Cannot find userIdAttribute in oauth configuration', { oauthConfiguration: config?.oauth })
  }

  const token = await getKeycloakToken()

  const filter = exactMatch ? `${query}` : `${query}*`
  const url = `${config.oauth.keycloak.authServerUrl}/admin/realms/${realm}/users?search=${filter}`

  let results
  try {
    results = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (err) {
    throw InternalError('Error when querying Keycloak for users.', { err })
  }
  const resultsData = await results.json() as { data: any[] }
  if (!resultsData.data) {
    return []
  }

  const initialValue: Array<UserInformation & { dn: string }> = []
  const users = resultsData.data.reduce((acc, keycloakUser) => {
    const dn = keycloakUser[dnName]
    if (!dn) {
      return acc
    }
    const email = keycloakUser.email
    const name = keycloakUser.firstName
    const info: UserInformation = {
      ...(email && { email }),
      ...(name && { name }),
    }
    acc.push({ ...info, dn })
    return acc
  }, initialValue)
  return users
}

async function getKeycloakToken() {
  if (!config?.oauth?.keycloak) {
    throw ConfigurationError('OAuth Keycloak configuration is missing')
  }
  const url = `${config.oauth.keycloak.authServerUrl}/realms/${config.oauth.keycloak.realm}/protocol/openid-connect/token`
  const params = new URLSearchParams()
  params.append('client_id', config.oauth.keycloak.clientId)
  params.append('client_secret', config.oauth.keycloak.clientSecret)
  params.append('grant_type', 'client_credentials')

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })
    const data = await response.json() as { access_token: string }
    if (!data.access_token) {
      throw InternalError('Access token is missing in the response', { response: data })
    }
    return data.access_token
  } catch (err) {
    throw InternalError('Error when obtaining Keycloak token.', { err })
  }
}
