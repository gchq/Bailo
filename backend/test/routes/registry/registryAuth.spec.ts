import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../../src/connectors/authorisation/index.js'
import { EntryKind } from '../../../src/models/Model.js'
import { checkAccess, getDockerRegistryAuth, softDeletePrefix } from '../../../src/routes/v1/registryAuth.js'

// **NOTICE: All functions tested in this file are located in routes/registryAuth.ts. It is assumed these will be moved to the services layer in the future, thus these tests should move too.**

vi.mock('../../../src/connectors/authorisation/index.js')
vi.mock('../../../src/utils/registryUtils.js')
vi.mock('fs/promises')

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../../src/services/model.js', () => modelMocks)

const user = { dn: 'dn' } as any
const userMocks = vi.hoisted(() => ({
  getUserFromAuthHeader: vi.fn(() => Promise.resolve({ user: user, admin: false })),
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

    createHash: actual.createHash,
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
  } as any

  const res = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any

  return { req, res }
}

describe('registryAuth', () => {
  describe('checkAccess', () => {
    test('failure > soft deleted', async () => {
      const name = `${softDeletePrefix}model/image`

      const auth = await checkAccess({ name } as any, user)

      expect(auth).toStrictEqual({
        id: name,
        success: false,
        info: `Access name must not begin with soft delete prefix: ${softDeletePrefix}`,
      } as any)
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
    test('success > without scope', async () => {
      const { req, res } = mockReqRes({})

      await getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
    })

    test('success > offline_token=true', async () => {
      const { req, res } = mockReqRes({ offline_token: 'true' })

      await getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
      expect(rlogMocks.logger.trace).toHaveBeenCalledWith('Successfully generated offline token')
    })

    test('success > basic push scope', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.Model,
      })
      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: true,
        actions: ['push'],
      } as any)
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:push',
      })

      await getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
      expect(rlogMocks.logger.trace).toHaveBeenCalledWith('Successfully generated access token.')
    })

    test('success > pull ignores unauthorised foreign scope (containerd cross-mount)', async () => {
      modelMocks.getModelById.mockRejectedValueOnce({}).mockResolvedValueOnce({ kind: EntryKind.Model })
      const { req, res } = mockReqRes({
        scope: ['repository:foreign/image:pull', 'repository:model/image:pull'],
      })

      await getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
      expect(rlogMocks.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          access: expect.objectContaining({ name: 'foreign/image' }),
        }),
        'Ignoring unauthorised scope.',
      )
    })

    test('success > push with extra unauthorised pull scope', async () => {
      modelMocks.getModelById
        .mockResolvedValueOnce({ kind: EntryKind.Model }) // push scope
        .mockRejectedValueOnce({}) // foreign pull scope
      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: true,
        actions: ['push'],
      } as any)
      const { req, res } = mockReqRes({
        scope: ['repository:model/image:push', 'repository:foreign/image:pull'],
      })

      await getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
      expect(rlogMocks.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          access: expect.objectContaining({ name: 'foreign/image' }),
        }),
        'Ignoring unauthorised scope.',
      )
    })

    test('success > wildcard scope with admin is permitted', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.Model,
      })
      userMocks.getUserFromAuthHeader.mockResolvedValueOnce({ user, admin: true })
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:*',
      })

      await getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
      expect(rlogMocks.logger.debug).not.toHaveBeenCalledWith(
        expect.objectContaining({
          access: expect.objectContaining({ name: 'model/image', actions: ['*'] }),
        }),
        'Ignoring unauthorised scope.',
      )
    })

    test('reject > no authorization header', async () => {
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:push',
      })
      req.get = vi.fn(() => false)

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^No authorisation header found/)
    })

    test('reject > getUserFromAuthHeader err', async () => {
      userMocks.getUserFromAuthHeader.mockResolvedValueOnce({ error: 'error' } as any)
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:push',
      })

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^error/)
    })

    test('reject > no user', async () => {
      userMocks.getUserFromAuthHeader.mockResolvedValueOnce({ user: false } as any)
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:push',
      })

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^User authentication failed/)
    })

    test('reject > no user', async () => {
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:push',
      })
      req.query.service = 'broken'

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^Received registry auth request from unexpected service/)
    })

    test('reject > no user', async () => {
      const { req, res } = mockReqRes({
        scope: 1,
      })

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^Scope is an unexpected value/)
    })

    test('reject > unauthorised push', async () => {
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

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^push denied/)
    })

    test('reject > mixed pull & push denied as push unauthorised', async () => {
      modelMocks.getModelById.mockResolvedValueOnce({
        kind: EntryKind.Model,
      })
      vi.mocked(authorisation.image).mockResolvedValueOnce({
        id: 'model',
        success: false,
      } as any)
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:pull,push',
      })

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^No authorised push scopes./)
    })

    test('reject > pull unauthorised', async () => {
      modelMocks.getModelById.mockRejectedValueOnce({})
      const { req, res } = mockReqRes({
        scope: 'repository:model/image:pull',
      })

      const result = getDockerRegistryAuth[1](req, res, undefined as any, undefined as any)

      await expect(result).rejects.toThrowError(/^Requested image is not accessible - no authorised scopes./)
    })
  })
})
