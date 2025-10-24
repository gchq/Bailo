import { describe, expect, test, vi } from 'vitest';
import { InternalError } from '../../src/utils/error.js';

// Mock Keycloak client methods and configuration
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock configuration
const configMock = vi.hoisted(() => ({
  oauth: {
    keycloak: {
      realm: 'test-realm',
      serverUrl: 'http://localhost',
      clientId: 'test-client',
      clientSecret: 'test-secret',
    },
  },
}));

vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}));

// Keycloak client mock implementation
vi.mock('../../src/clients/keycloak.js', () => ({
  __esModule: true,
  listUsers: async (query: string, exactMatch: boolean = false) => {
    const keycloakConfig = configMock.oauth?.keycloak as {
      realm: string;
      serverUrl: string;
      clientId: string;
      clientSecret: string;
    };
    if (!keycloakConfig) {
      throw new Error('OAuth Keycloak configuration is missing');
    }
    const token = 'mock-token'; // Assume token retrieval logic is mocked

    const filter = exactMatch ? query : `${query}*`;
    const url = `${keycloakConfig.serverUrl}/admin/realms/${keycloakConfig.realm}/users?search=${filter}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error when querying Keycloak for users.');
    }

    const users = await response.json() as any[];
    return users
      .filter((user: any) => user.id) // Exclude users without `id`
      .map((user: any) => ({
        dn: user.id,
        email: user.email,
        name: user.firstName,
      }));
  },
}));

describe('clients > keycloak', () => {
  test('listUsers > success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'user1', email: 'email@test.com', firstName: 'Test' }],
    });

    const { listUsers } = await import('../../src/clients/keycloak.js');
    const results = await listUsers('user');

    expect(results).toStrictEqual([
      {
        dn: 'user1',
        email: 'email@test.com',
        name: 'Test',
      },
    ]);
  });

  test('listUsers > missing configuration', async () => {
    vi.spyOn(configMock.oauth, 'keycloak', 'get').mockReturnValueOnce(undefined as any);

    const { listUsers } = await import('../../src/clients/keycloak.js');
    await expect(() => listUsers('user')).rejects.toThrowError(
      'OAuth Keycloak configuration is missing'
    );
  });

  test('listUsers > do not include users with missing DN', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ email: 'email@test.com', firstName: 'Test' }], // Missing `id`
    });

    const { listUsers } = await import('../../src/clients/keycloak.js');
    const results = await listUsers('user');

    expect(results).toStrictEqual([]); // Exclude users without `id`
  });

  test('listUsers > no users', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { listUsers } = await import('../../src/clients/keycloak.js');
    const results = await listUsers('user');

    expect(results).toStrictEqual([]);
  });

  test('listUsers > error when querying keycloak', async () => {
    fetchMock.mockRejectedValueOnce(InternalError('Error when querying Keycloak for users'));
  
    const { listUsers } = await import('../../src/clients/keycloak.js');
    await expect(() => listUsers('user')).rejects.toThrowError(
      'Error when querying Keycloak for users'
    );
  });

  test('listUsers > exact match', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { listUsers } = await import('../../src/clients/keycloak.js');
    await listUsers('user', true);

    expect(fetchMock).toBeCalledWith(
      'http://localhost/admin/realms/test-realm/users?search=user',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Bearer mock-token`,
        }),
      })
    );
  });
});
