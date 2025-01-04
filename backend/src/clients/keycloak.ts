import c from 'config'
import config from '../utils/config.js'
import fetch, { Response } from 'node-fetch'
import { UserInformation } from '../connectors/authentication/Base.js'
import { ConfigurationError, InternalError } from '../utils/error.js'

type KeycloakUser = {
  id: string;
  email?: string;
  firstName?: string;
};

function isKeycloakUserArray(resp: unknown): resp is KeycloakUser[] {
  if (!Array.isArray(resp)) {
    return false;
  }
  return resp.every(user => typeof user === 'object' && user !== null && 'id' in user);
}

type TokenResponse = {
  access_token: string;
};

function isTokenResponse(resp: unknown): resp is TokenResponse {
  return typeof resp === 'object' && resp !== null && 'access_token' in resp;
}

export async function listUsers(query: string, exactMatch = false) {
  let dnName: string
  let realm: string

  if (!config.oauth?.keycloak) {
    throw ConfigurationError('OAuth Keycloak configuration is missing')
  }

  try {
    realm = config.oauth.keycloak.realm
  } catch (e) {
    throw ConfigurationError('Cannot find realm in Keycloak configuration', { config: config.oauth.keycloak })
  }

  const token = await getKeycloakToken()

  const filter = exactMatch ? `${query}` : `${query}*`
  const url = `${config.oauth.keycloak.serverUrl}/admin/realms/${realm}/users?search=${filter}`

  let results: Response
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
  const resultsData = await results.json()
  if (!isKeycloakUserArray(resultsData)) {
    throw InternalError('Unrecognised response body when listing users.', { responseBody: resultsData });
  }
  if (!resultsData || resultsData.length === 0) {
    return []
  }

  const initialValue: Array<UserInformation & { dn: string }> = []
  const users = resultsData.reduce((acc, keycloakUser) => {
    const dn = keycloakUser.id // Assuming 'id' is the dnName
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
  if (!config.oauth?.keycloak) {
    throw ConfigurationError('OAuth Keycloak configuration is missing')
  }
  const url = `${config.oauth.keycloak.serverUrl}/realms/${config.oauth.keycloak.realm}/protocol/openid-connect/token`
  const params = new URLSearchParams()
  params.append('client_id', config.oauth.keycloak.clientId)
  params.append('client_secret', config.oauth.keycloak.clientSecret)
  params.append('grant_type', 'client_credentials')

  try {
    const response: Response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })
    const data = await response.json();
    if (!isTokenResponse(data)) {
      throw InternalError('Unrecognised response body when obtaining Keycloak token.', { responseBody: data });
    }
    if (!data.access_token) {
      throw InternalError('Access token is missing in the response', { response: data })
    }
    return data.access_token
  } catch (err) {
    throw InternalError('Error when obtaining Keycloak token.', { err })
  }
}
