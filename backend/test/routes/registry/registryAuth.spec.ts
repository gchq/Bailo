import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../../src/connectors/authorisation/index.js'
import { EntryKind } from '../../../src/models/Model.js'
import {
  checkAccess,
  getAdminToken,
  getDockerRegistryAuth,
  parseResourceScope,
  softDeletePrefix,
} from '../../../src/routes/v1/registryAuth.js'

// **NOTICE: All functions tested in this file are located in routes/registryAuth.ts. It is assumed these will be moved to the services layer in the future, thus these tests should move too.**

vi.mock('../../../src/connectors/authorisation/index.js')
vi.mock('../../../src/utils/registryUtils.js')

const fsMocks = vi.hoisted(() => ({
  readFile: vi.fn().mockResolvedValue('test-private-key'),
}))
vi.mock('fs/promises', () => fsMocks)

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => modelMocks)

const user = { dn: 'dn' } as any
const userMocks = vi.hoisted(() => ({
  getUserFromAuthHeader: vi.fn(() => Promise.resolve({ user, admin: false })),
}))
vi.mock('../../../src/utils/user.js', () => userMocks)

vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto')

  return {
    ...actual,

    X509Certificate: class {
      raw: Buffer

      constructor() {
        // Minimal valid DER-like buffer
        this.raw = Buffer.from('test-cert')
      }
    },

    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => Buffer.alloc(32)), // stable deterministic hash
    })),
  }
})

vi.mock('jsonwebtoken', async () => {
  const actual = await vi.importActual<any>('jsonwebtoken')

  return {
    ...actual,
    default: {
      ...actual.default,
      sign: vi.fn(() => 'mock.jwt.token'),
    },
  }
})

const rlogMocks = vi.hoisted(() => {
  const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => logger),
  }

  return { logger }
})
vi.mock('../../../src/services/log.js', () => ({
  default: rlogMocks.logger,
}))

function mockReqRes(query: any = {}) {
  const req = {
    query,
    get: vi.fn().mockReturnValue('Bearer token'),
    log: {
      trace: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
    originalUrl: '/v2/auth',
  } as any

  const res = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any

  return { req, res }
}

async function invokeWithErrorHandling(req: any, res: any) {
  let caught: unknown
  try {
    await getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)
  } catch (err) {
    caught = err
  }

  if (caught) {
    await getDockerRegistryAuth[2](caught as any, req, res, undefined as any)
  }
}

describe('registryAuth', () => {
  describe('parseResourceScope', () => {
    const cases: Array<{
      name: string
      input: string
      expected: any
      throws?: boolean
    }> = [
      {
        name: 'single scope, single action',
        input: 'repo:myrepo:pull',
        expected: [{ type: 'repo', name: 'myrepo', actions: ['pull'] }],
      },
      {
        name: 'single scope, multiple actions',
        input: 'repo:myrepo:pull,push,delete',
        expected: [{ type: 'repo', name: 'myrepo', actions: ['pull', 'push', 'delete'] }],
      },
      {
        name: 'multiple scopes',
        input: 'repo:myrepo:pull image:myimage:push',
        expected: [
          { type: 'repo', name: 'myrepo', actions: ['pull'] },
          { type: 'image', name: 'myimage', actions: ['push'] },
        ],
      },
      {
        name: 'wildcard action',
        input: 'repo:myrepo:*',
        expected: [{ type: 'repo', name: 'myrepo', actions: ['*'] }],
      },
      {
        name: 'resource type with subtype',
        input: 'repo(docker):library/nginx:pull,push',
        expected: [{ type: 'repo(docker)', name: 'library/nginx', actions: ['pull', 'push'] }],
      },
      {
        name: 'hostname in resource name',
        input: 'repo:registry.example.com/library/nginx:pull',
        expected: [{ type: 'repo', name: 'registry.example.com/library/nginx', actions: ['pull'] }],
      },
      {
        name: 'hostname with port',
        input: 'repo:registry.example.com:5000/library/nginx:pull',
        expected: [
          {
            type: 'repo',
            name: 'registry.example.com:5000/library/nginx',
            actions: ['pull'],
          },
        ],
      },
      {
        name: 'path components with separators',
        input: 'repo:my_org/my.repo__name-v1:pull',
        expected: [{ type: 'repo', name: 'my_org/my.repo__name-v1', actions: ['pull'] }],
      },
      {
        name: 'list action',
        input: 'repo:myrepo:list',
        expected: [{ type: 'repo', name: 'myrepo', actions: ['list'] }],
      },
      {
        name: 'empty action allowed by grammar',
        input: 'repo:myrepo:',
        expected: [{ type: 'repo', name: 'myrepo', actions: [] }],
      },
      {
        name: 'complex mixed example',
        input: 'repo(docker):registry.io/team/app_v2:pull,push image(oci):busybox:*',
        expected: [
          {
            type: 'repo(docker)',
            name: 'registry.io/team/app_v2',
            actions: ['pull', 'push'],
          },
          {
            type: 'image(oci)',
            name: 'busybox',
            actions: ['*'],
          },
        ],
      },
      {
        name: 'invalid scope is rejected',
        input: 'repo:myrepo:pull *',
        expected: null,
        throws: true,
      },
      {
        name: 'missing resourcetype is rejected',
        input: ':myrepo:pull',
        expected: null,
        throws: true,
      },
      {
        name: 'missing resourcename is rejected',
        input: 'repo::pull',
        expected: null,
        throws: true,
      },
    ]

    test.each(cases)('$name', ({ input, expected, throws }) => {
      if (throws) {
        expect(() => parseResourceScope(input)).toThrow()
      } else {
        expect(parseResourceScope(input)).toEqual(expected)
      }
    })
  })

  describe('getAdminToken', () => {
    test('success > deterministic UUID-like token', async () => {
      const token = await getAdminToken()

      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    test('success > same token on subsequent calls', async () => {
      const token1 = await getAdminToken()
      const token2 = await getAdminToken()

      expect(token1).toBe(token2)
    })
  })

  describe('checkAccess', () => {
    test('failure > soft deleted', async () => {
      const name = `${softDeletePrefix}model/image`

      const auth = await checkAccess({ name } as any, user)

      expect(auth).toStrictEqual({
        id: name,
        success: false,
        info: `Access name must not begin with soft delete prefix: ${softDeletePrefix}`,
      })
    })

    test('failure > no image name', async () => {
      const name = 'model'

      const auth = await checkAccess({ name } as any, user)

      expect(auth).toStrictEqual({
        id: name,
        success: false,
        info: `ModelId not found.`,
      })
    })

    test.each(['push', 'pull', 'delete', 'list', '*'])('failure > bad modelId $0', async (action) => {
      const name = 'badModelId/fakeImage'
      const modelId = name.split('/')[0]
      modelMocks.getModelById.mockRejectedValueOnce({})

      const auth = await checkAccess({ name, actions: [action] } as any, user)

      expect(auth).toStrictEqual({ id: modelId, success: false, info: 'ModelId not found.' })
    })

    test('failure > incorrect entry type', async () => {
      const name = 'modelId/fakeImage'
      const modelId = name.split('/')[0]
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.DataCard,
      })

      const auth = await checkAccess({ name, actions: [] } as any, user)

      expect(auth).toStrictEqual({
        id: modelId,
        success: false,
        info: `No registry use allowed on ${EntryKind.DataCard}.`,
      })
    })

    test.each(['push', 'delete'])('failure > limited access for mirrored model entry type $0', async (action) => {
      const name = 'modelId/fakeImage'
      const modelId = name.split('/')[0]
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.MirroredModel,
      })

      const auth = await checkAccess({ name, actions: [action] } as any, user)

      expect(auth).toStrictEqual({
        id: modelId,
        success: false,
        info: 'You are not allowed to complete any actions beyond `pull` or `list` on an image associated with a mirrored model.',
      })
    })

    test('success > basic push pull', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.Model,
      })
      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: true,
        actions: ['pull', 'push'],
      } as any)

      const auth = await checkAccess({ name: 'model/image', actions: ['pull', 'push'] } as any, user)

      expect(authorisation.image).toHaveBeenCalled()
      expect(auth.success).toBe(true)
    })

    test('success > pull mirrored model', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.MirroredModel,
      })
      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: true,
        actions: ['pull'],
      } as any)

      const auth = await checkAccess({ name: 'model/image', actions: ['pull'] } as any, user)

      expect(authorisation.image).toHaveBeenCalled()
      expect(auth.success).toBe(true)
    })
  })

  describe('getDockerRegistryAuth', () => {
    test('success > login without scope', async () => {
      const { req, res } = mockReqRes()

      await invokeWithErrorHandling(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
    })

    test('success > offline token', async () => {
      const { req, res } = mockReqRes({ offline_token: 'true' })

      await invokeWithErrorHandling(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
      expect(rlogMocks.logger.trace).toHaveBeenCalledWith('Successfully generated offline token')
    })

    test('success > authorised push', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.Model,
      })
      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: true,
      })
      const { req, res } = mockReqRes({ scope: 'repository:model/image:push' })

      await invokeWithErrorHandling(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
      expect(rlogMocks.logger.trace).toHaveBeenCalledWith('Successfully generated access token.')
    })

    test('success > unauthorised foreign pull ignored (containerd cross-mount)', async () => {
      modelMocks.getModelById.mockRejectedValueOnce({}).mockResolvedValueOnce({ kind: EntryKind.Model })
      const { req, res } = mockReqRes({
        scope: ['repository:foreign/image:pull', 'repository:model/image:pull'],
      })

      await invokeWithErrorHandling(req, res)

      expect(res.json).toHaveBeenCalled()
      expect(rlogMocks.logger.debug).toHaveBeenCalled()
    })

    test('success > push with extra unauthorised pull scope', async () => {
      modelMocks.getModelById
        .mockResolvedValueOnce({ kind: EntryKind.Model }) // push scope
        .mockRejectedValueOnce({}) // foreign pull scope
      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: true,
      } as any)
      const { req, res } = mockReqRes({
        scope: ['repository:model/image:push', 'repository:foreign/image:pull'],
      })

      await invokeWithErrorHandling(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
      expect(rlogMocks.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          access: expect.objectContaining({ name: 'foreign/image' }),
        }),
        'Ignoring unauthorised read-only scope',
      )
    })

    test('success > wildcard scope with admin is permitted', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({ kind: EntryKind.Model })
      userMocks.getUserFromAuthHeader.mockResolvedValueOnce({ user, admin: true })
      vi.mocked(authorisation.image).mockResolvedValueOnce({ id: 'model', success: true })
      const { req, res } = mockReqRes({ scope: 'repository:model/image:*' })

      await invokeWithErrorHandling(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
      expect(rlogMocks.logger.debug).not.toHaveBeenCalledWith(
        expect.objectContaining({
          access: expect.objectContaining({
            name: 'model/image',
            actions: ['*'],
          }),
        }),
        expect.stringContaining('Ignoring unauthorised'),
      )
    })

    test('reject > no authorization header', async () => {
      const { req, res } = mockReqRes({ scope: 'repository:model/image:push' })
      req.get = vi.fn(() => false)

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^No authorisation header found/)
    })

    test('reject > getUserFromAuthHeader err', async () => {
      userMocks.getUserFromAuthHeader.mockResolvedValueOnce({ error: 'error' } as any)
      const { req, res } = mockReqRes({ scope: 'repository:model/image:push' })

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^error/)
    })

    test('reject > no user', async () => {
      userMocks.getUserFromAuthHeader.mockResolvedValueOnce({ user: false } as any)
      const { req, res } = mockReqRes({ scope: 'repository:model/image:push' })

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^User authentication failed/)
    })

    test('reject > broken service', async () => {
      const { req, res } = mockReqRes({ scope: 'repository:model/image:push' })
      req.query.service = 'broken'

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^Received registry auth request from unexpected service/)
    })

    test('reject > unauthorised push', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({ kind: EntryKind.Model })
      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: false,
        info: 'push denied',
      })
      const { req, res } = mockReqRes({ scope: 'repository:model/image:push' })

      await invokeWithErrorHandling(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          expect.objectContaining({
            code: 'DENIED',
            message: 'push denied',
          }),
        ],
      })
    })

    test('reject > mixed pull & push denied', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.Model,
      })
      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: false,
        info: 'No authorised push scopes.',
      } as any)
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:pull,push',
      })

      await invokeWithErrorHandling(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          expect.objectContaining({
            code: 'DENIED',
            message: 'No authorised push scopes.',
          }),
        ],
      })
    })

    test('reject > push with no authorised push scopes', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.Model,
      })

      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: false,
        info: 'push denied',
      } as any)
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:push',
      })

      await invokeWithErrorHandling(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          expect.objectContaining({
            code: 'DENIED',
            message: 'push denied',
          }),
        ],
      })
    })

    test('reject > malformed scope value', async () => {
      const { req, res } = mockReqRes({
        scope: 123,
      })

      await invokeWithErrorHandling(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          expect.objectContaining({
            code: 'DENIED',
            message: 'Scope is an unexpected value',
          }),
        ],
      })
    })

    test('reject > all requested scopes unauthorised and ignored', async () => {
      modelMocks.getModelById.mockRejectedValueOnce({})
      const { req, res } = mockReqRes({
        scope: 'repository:foreign/image:pull',
      })

      await invokeWithErrorHandling(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          expect.objectContaining({
            code: 'DENIED',
            message: 'Requested image is not accessible - no authorised scopes.',
          }),
        ],
      })
    })

    test('reject > missing authorisation header', async () => {
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:pull',
      })
      req.get = vi.fn(() => undefined)

      await invokeWithErrorHandling(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'No authorisation header found',
          }),
        ],
      })
    })

    test('reject > unauthenticated user', async () => {
      userMocks.getUserFromAuthHeader.mockResolvedValueOnce({
        user: undefined,
      } as any)

      const { req, res } = mockReqRes({
        scope: 'repository:model/image:pull',
      })

      await invokeWithErrorHandling(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'User authentication failed',
          }),
        ],
      })
    })
  })
})
