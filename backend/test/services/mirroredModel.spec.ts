import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import { UserInterface } from '../../src/models/User.js'
import { exportModel } from '../../src/services/mirroredModel.js'

vi.mock('../../src/connectors/authorisation/index.js')

const configMock = vi.hoisted(
  () =>
    ({
      modelMirror: {
        enabled: true,
        export: {
          kmsSignature: {
            enabled: false,
          },
        },
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
}))
vi.mock('../../src/services/log.js', async () => ({
  default: logMock,
}))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(() => ({ settings: { mirroredModelId: 'abc' } })),
  getModelCardRevisions: vi.fn(() => [{ toJSON: vi.fn(), version: 123 }]),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const releaseMocks = vi.hoisted(() => ({
  getReleasesBySemvers: vi.fn(() => [{}]),
}))
vi.mock('../../src/services/release.js', () => releaseMocks)

const fileMocks = vi.hoisted(() => ({
  getFilesByIds: vi.fn(),
}))
vi.mock('../../src/services/file.js', () => fileMocks)

const archiverMocks = vi.hoisted(() => ({
  append: vi.fn(),
  finalize: vi.fn(),
  pipe: vi.fn(),
}))
vi.mock('archiver', () => ({ default: vi.fn(() => archiverMocks) }))

const s3Mocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(() => ({ fileSize: 100 })),
  getObjectStream: vi.fn(() => ({ Body: { pipe: vi.fn() } })),
}))
vi.mock('../../src/clients/s3.js', () => s3Mocks)

const kmsMocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(() => ({ fileSize: 100 })),
  getObjectStream: vi.fn(() => ({ Body: { pipe: vi.fn() } })),
}))
vi.mock('../../src/clients/kms`.js', () => kmsMocks)

const hashMocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(() => ({ fileSize: 100 })),
}))
vi.mock('node:crypto', () => hashMocks)

describe('services > mirroredModel', () => {
  test('exportModel > not enabled', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({ enabled: false })
    const response = exportModel({} as UserInterface, 'modelId', true)

    expect(response).rejects.toThrowError('Model mirroring has not been enabled.')
  })

  test('exportModel > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    const response = exportModel({} as UserInterface, 'modelId', true)
    expect(response).rejects.toThrowError(/^You do not have permission/)
  })

  test('exportModel > missing disclaimer agreement', async () => {
    const response = exportModel({} as UserInterface, 'modelId', false)
    expect(response).rejects.toThrowError(
      /^You must agree to the disclaimer agreement before being able to export a model./,
    )
  })

  test('exportModel > unable to create model card zip file', async () => {
    archiverMocks.append.mockImplementationOnce(() => {
      throw Error('Error making zip file')
    })
    const response = exportModel({} as UserInterface, 'modelId', true)
    expect(response).rejects.toThrowError(/^Error when generating the model card revisions zip file./)
  })

  test('exportModel > unable to create release zip file', async () => {
    archiverMocks.append.mockReturnValueOnce({})
    archiverMocks.append.mockImplementationOnce(() => {
      throw Error('Error making zip file')
    })
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    expect(response).rejects.toThrowError(/^Error when generating the release zip file./)
  })

  test('exportModel > signature is added when enabled in config', async () => {
    // need to mock stuff in checkFilesForRealeses
    configMock.modelMirror.export.kmsSignature.enabled = true
    const response = await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    expect(response).rejects.toThrowError(/^Error when generating the release zip file./)
  })

  /*
  test('exportModelCardRevisions > unable to create the signature for the zip file', async () => {
    const response = exportModelCardRevisions({} as UserInterface, 'modelId', true)
    expect(response).rejects.toThrowError(/^Error when generating the zip hash./)
  })
  */
})
