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
  getModelById: vi.fn(),
  getModelCardRevisions: vi.fn(() => [{ toJSON: vi.fn(), version: 123 }]),
}))
vi.mock('../../src/services/release.js', () => releaseMocks)

const fileMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
  getModelCardRevisions: vi.fn(() => [{ toJSON: vi.fn(), version: 123 }]),
}))
vi.mock('../../src/services/release.js', () => fileMocks)

const archiverMocks = vi.hoisted(() => ({
  append: vi.fn(),
  finalize: vi.fn(),
  pipe: vi.fn(),
}))
vi.mock('archiver', () => ({ default: vi.fn(() => archiverMocks) }))

describe('services > mirroredModel', () => {
  test('exportModel > not enabled', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({ enabled: false })
    const response = exportModel({} as UserInterface, 'modelId', true)

    expect(response).rejects.toThrowError('Model mirroring has not been enabled.')
  })

  test('exportModelCardRevisions > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    const response = exportModel({} as UserInterface, 'modelId', true)
    expect(response).rejects.toThrowError(/^You do not have permission/)
  })

  test('exportModelCardRevisions > missing disclaimer agreement', async () => {
    const response = exportModel({} as UserInterface, 'modelId', false)
    expect(response).rejects.toThrowError(
      /^You must agree to the disclaimer agreement before being able to export a model./,
    )
  })

  test('exportModelCardRevisions > unable to create model card zip file', async () => {
    archiverMocks.append.mockImplementationOnce(() => {
      throw Error('Error making zip file')
    })
    const response = exportModel({} as UserInterface, 'modelId', true)
    expect(response).rejects.toThrowError(/^Error when generating the model card revisions zip file./)
  })

  /*
  test('exportModelCardRevisions > unable to create the signature for the zip file', async () => {
    const response = exportModelCardRevisions({} as UserInterface, 'modelId', true)
    expect(response).rejects.toThrowError(/^Error when generating the zip hash./)
  })
  */
})
