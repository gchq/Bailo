import { describe, expect, test, vi } from 'vitest'

import { listUsers } from '../../src/clients/cognito.js'

const configMock = vi.hoisted(
  () =>
    ({
      oauth: {
        cognito: {
          userIdAttribute: 'email',
          userPoolId: 'email',
          identityProviderClient: {
            credentials: {
              accessKeyId: '',
              secretAccessKey: '',
            },
          },
        },
      },
      log: {
        level: 'info',
      },
      instrumentation: {
        enabled: false,
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const cognitoMock = vi.hoisted(() => {
  const send = vi.fn()

  return {
    send,
    ListUsersCommand: vi.fn(() => ({})),
    CognitoIdentityProviderClient: vi.fn(() => ({ send })),
  }
})
vi.mock('@aws-sdk/client-cognito-identity-provider', () => cognitoMock)

describe('clients > cognito', () => {
  test('listUsers > success', async () => {
    cognitoMock.send.mockResolvedValueOnce({ Users: [{ Attributes: [{ Name: 'email', Value: 'email@test.com' }] }] })

    const results = await listUsers('dn')

    expect(results).toStrictEqual([
      {
        dn: 'email@test.com',
        email: 'email@test.com',
      },
    ])
  })

  test('listUsers > missing configuration', async () => {
    vi.spyOn(configMock, 'oauth', 'get').mockReturnValueOnce({})
    const response = listUsers('dn')

    expect(response).rejects.toThrowError('Cannot find userIdAttribute in oauth configuration')
  })

  test('listUsers > do not include users with missing DN', async () => {
    cognitoMock.send.mockResolvedValueOnce({
      Users: [
        { Attributes: [{ Name: 'email', Value: 'email@test.com' }] },
        { Attributes: [{ Name: 'att', Value: 'value' }] },
      ],
    })

    const results = await listUsers('dn')

    expect(results).toStrictEqual([
      {
        dn: 'email@test.com',
        email: 'email@test.com',
      },
    ])
  })

  test('listUsers > no users', async () => {
    cognitoMock.send.mockResolvedValueOnce({})

    const results = await listUsers('dn')

    expect(results).toStrictEqual([])
  })

  test('listUsers > error when querying cognito', async () => {
    cognitoMock.send.mockRejectedValueOnce('Error')

    const response = listUsers('dn')

    expect(response).rejects.toThrowError('Error when querying Cognito for users')
  })

  test('listUsers > exact match', async () => {
    cognitoMock.send.mockResolvedValueOnce({})

    await listUsers('dn', true)

    expect(cognitoMock.ListUsersCommand).toBeCalledWith({
      UserPoolId: 'email',
      Filter: `"email"="dn"`,
    })
  })
})
