import { beforeEach, type MockedFunction, MockInstance, vi } from 'vitest'

const CHAINABLE_METHODS = [
  'aggregate',
  'match',
  'group',
  'sort',
  'find',
  'findById',
  'findByIdAndDelete',
  'findOne',
  'findOneAndDelete',
  'findOneAndUpdate',
  'lookup',
  'update',
  'updateOne',
  'updateMany',
  'delete',
  'deleteOne',
  'deleteMany',
  'save',
  'append',
] as const

type MethodNames = (typeof CHAINABLE_METHODS)[number]

export function createMongooseModelMock<TDoc extends { _id?: any }>(
  name = 'MockModel',
  toObjectValue: Partial<TDoc> = {},
) {
  type InstanceType = Partial<TDoc> & Record<MethodNames | 'toObject', any> & { _id: { toString: () => string } }

  const makeId = (idValue: string = 'mock-id') => ({
    toString: () => idValue,
  })

  // Master set of mocks shared between static and every instance
  const mockFns: Record<MethodNames, MockedFunction<any>> = {} as any
  for (const m of CHAINABLE_METHODS) {
    mockFns[m] = vi.fn()
  }

  const createInstance = (doc?: Partial<TDoc>): InstanceType => {
    const inst: InstanceType = {
      _id: makeId(),
      toObject: vi.fn(() => ({ ...toObjectValue, ...doc })),
    } as InstanceType
    for (const m of CHAINABLE_METHODS) {
      inst[m] = mockFns[m].mockImplementation(() => inst)
    }
    Object.assign(inst, doc)
    return inst
  }

  const Model = vi.fn(function (doc?: Partial<TDoc>) {
    return createInstance(doc)
  }) as unknown as {
    new (doc?: Partial<TDoc>): TDoc & InstanceType
  }

  // Attach static methods: share same mocks for instance methods
  for (const m of CHAINABLE_METHODS) {
    ;(Model as any)[m] = mockFns[m]
  }

  // Chainable query-like methods for aggregate/match/group
  const queryLike: any = {}
  for (const m of [
    'aggregate',
    'find',
    'match',
    'group',
    'sort',
    'map',
    'filter',
    'unwind',
    'lookup',
    'append',
  ] as const) {
    queryLike[m] = vi.fn(() => queryLike)
    ;(Model as any)[m] = queryLike[m]
  }

  // Finder statics returning new instances
  ;(Model as any).findById = vi.fn(async () => createInstance())
  ;(Model as any).findOne = vi.fn(async () => createInstance())
  ;(Model as any).findOneAndUpdate = vi.fn(async () => createInstance())
  ;(Model as any).findOneAndDelete = vi.fn(async () => createInstance())
  ;(Model as any).countDocuments = vi.fn().mockResolvedValue(0) as MockedFunction<(filter?: any) => Promise<number>>

  // Reset function to clear all mocks
  ;(Model as any).reset = () => {
    for (const key of Object.keys(mockFns)) {
      mockFns[key].mockClear()
      mockFns[key].mockReset()
    }
    for (const key of ['findById', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'countDocuments'] as const) {
      const val = (Model as any)[key]
      if (typeof val === 'function' && 'mockClear' in val) {
        val.mockClear()
        val.mockReset?.()
      }
    }
    for (const key of Object.keys(queryLike)) {
      queryLike[key].mockClear()
      queryLike[key].mockReset()
    }
  }

  Object.defineProperty(Model, 'name', { value: name })

  return Model as MockInstance & {
    new (doc?: Partial<TDoc>): TDoc & InstanceType
  } & Record<MethodNames, MockedFunction<any>> & {
      findById: MockedFunction<(id: any) => Promise<TDoc & InstanceType>>
      findOne: MockedFunction<(filter?: any) => Promise<TDoc & InstanceType>>
      findOneAndDelete: MockedFunction<(filter?: any) => Promise<TDoc & InstanceType>>
      findOneAndUpdate: MockedFunction<(filter?: any) => Promise<TDoc & InstanceType>>
      countDocuments: MockedFunction<(filter?: any) => Promise<number>>
      reset(): void
    }
}

// Sadly, it is not possible to dynamically load and use a programmatic loop here as `vi.mock` is hoisted so runtime variables would not be initialised
export const modelMocks = {
  AccessRequestModel: createMongooseModelMock('AccessRequest'),
  FileModel: createMongooseModelMock('FileModel', {
    _id: 'mockFileId',
    modelId: 'mockModelId',
    name: 'mockFileName',
    size: 100,
    mime: 'mock/mime',
    path: '/mock/path',
    complete: true,
    tags: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  }),
  InferenceModel: createMongooseModelMock('InferenceModel'),
  MigrationModel: createMongooseModelMock('MigrationModel'),
  ModelModel: createMongooseModelMock('ModelModel'),
  ModelCardRevisionModel: createMongooseModelMock('ModelCardRevisionModel'),
  ReleaseModel: createMongooseModelMock('ReleaseModel'),
  ResponseModel: createMongooseModelMock('ResponseModel'),
  ReviewModel: createMongooseModelMock('ReviewModel'),
  ReviewRoleModel: createMongooseModelMock('ReviewRoleModel'),
  ScanModel: createMongooseModelMock('ScanModel'),
  SchemaModel: createMongooseModelMock('SchemaModel'),
  SchemaMigrationModel: createMongooseModelMock('SchemaMigrationModel'),
  TokenModel: createMongooseModelMock('TokenModel'),
  UserModel: createMongooseModelMock('UserModel'),
  WebhookModel: createMongooseModelMock('WebhookModel'),
}

// Apply mocks using vi.mock
vi.mock('../../src/models/AccessRequest.ts', () => ({ default: modelMocks.AccessRequestModel }))
vi.mock('../../src/models/File.ts', () => ({ default: modelMocks.FileModel }))
vi.mock('../../src/models/Inference.ts', () => ({ default: modelMocks.InferenceModel }))
vi.mock('../../src/models/Migration.ts', () => ({ default: modelMocks.MigrationModel }))
vi.mock('../../src/models/Model.ts', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return { ...actual, default: modelMocks.ModelModel }
})
vi.mock('../../src/models/ModelCardRevision.ts', () => ({ default: modelMocks.ModelCardRevisionModel }))
vi.mock('../../src/models/Release.ts', () => ({ default: modelMocks.ReleaseModel }))
vi.mock('../../src/models/Response.ts', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return { ...actual, default: modelMocks.ResponseModel }
})
vi.mock('../../src/models/Review.ts', () => ({ default: modelMocks.ReviewModel }))
vi.mock('../../src/models/ReviewRole.ts', () => ({ default: modelMocks.ReviewRoleModel }))
vi.mock('../../src/models/Scan.ts', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return { ...actual, default: modelMocks.ScanModel }
})
vi.mock('../../src/models/Schema.ts', () => ({ default: modelMocks.SchemaModel }))
vi.mock('../../src/models/SchemaMigration.ts', () => ({ default: modelMocks.SchemaMigrationModel }))
vi.mock('../../src/models/Token.ts', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return { ...actual, default: modelMocks.TokenModel }
})
vi.mock('../../src/models/User.ts', () => ({ default: modelMocks.UserModel }))
vi.mock('../../src/models/Webhook.ts', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return { ...actual, default: modelMocks.WebhookModel }
})

// Automatically reset all model mocks before each test
beforeEach(() => {
  for (const mock of Object.values(modelMocks)) {
    if (typeof mock.reset === 'function') {
      mock.reset()
    }
  }
})

export type ModelMockType<K extends keyof typeof modelMocks> = (typeof modelMocks)[K]
export function getTypedModelMock<K extends keyof typeof modelMocks>(key: K): ModelMockType<K> {
  return modelMocks[key]
}
