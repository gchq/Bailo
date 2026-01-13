import { beforeEach, type MockedFunction, MockInstance, vi } from 'vitest'

const CHAINABLE_METHODS = [
  'aggregate',
  'append',
  'delete',
  'deleteMany',
  'deleteOne',
  'find',
  'findById',
  'findByIdAndDelete',
  'findOne',
  'findOneAndDelete',
  'findOneAndUpdate',
  'group',
  'lookup',
  'match',
  'save',
  'sort',
  'update',
  'updateMany',
  'updateOne',
  'markModified',
] as const

const QUERY_LIKE_METHODS = [
  'aggregate',
  'find',
  'append',
  'filter',
  'group',
  'lookup',
  'map',
  'match',
  'sort',
  'unwind',
] as const

type MethodNames = (typeof CHAINABLE_METHODS)[number]

type InstanceType<TDoc> = Partial<TDoc> &
  Record<MethodNames | 'toObject', any> & {
    _id: { toString: () => string }
  }

type ModelMock<TDoc extends { _id?: any }> = MockInstance & {
  new (doc?: Partial<TDoc>): TDoc & InstanceType<TDoc>
} & Record<MethodNames, MockedFunction<any>> & {
    findById: MockedFunction<(id: any) => Promise<TDoc & InstanceType<TDoc>>>
    findOne: MockedFunction<(filter?: any) => Promise<TDoc & InstanceType<TDoc>>>
    findOneAndDelete: MockedFunction<(filter?: any) => Promise<TDoc & InstanceType<TDoc>>>
    findOneAndUpdate: MockedFunction<(filter?: any) => Promise<TDoc & InstanceType<TDoc>>>
    save: MockedFunction<() => Promise<TDoc & InstanceType<TDoc>>>
    countDocuments: MockedFunction<(filter?: any) => Promise<number>>
    reset(): void
  }

const createId = (idValue: string = 'mock-id') => ({
  toString: () => idValue,
})

function createMockFns(): Record<MethodNames, MockedFunction<any>> {
  return CHAINABLE_METHODS.reduce(
    (acc, method) => {
      acc[method] = vi.fn()
      return acc
    },
    {} as Record<MethodNames, MockedFunction<any>>,
  )
}

function createInstance<TDoc extends { _id?: any }>(
  toObjectValue: Partial<TDoc>,
  doc: Partial<TDoc> | undefined,
  chainMocks: Record<MethodNames, MockedFunction<any>>,
): InstanceType<TDoc> {
  const instance: InstanceType<TDoc> = {
    _id: createId(),
    toObject: vi.fn(() => ({ ...toObjectValue, ...doc })),
  } as InstanceType<TDoc>

  for (const method of CHAINABLE_METHODS) {
    instance[method] = chainMocks[method].mockImplementation(() => instance)
  }

  Object.assign(instance, doc)
  return instance
}

function attachQueryLikeMethods(target: any, queryMockSet: Record<string, MockedFunction<any>>): void {
  for (const method of QUERY_LIKE_METHODS) {
    queryMockSet[method] = vi.fn(() => queryMockSet)
    target[method] = queryMockSet[method]
  }
}

function attachFinderMethods<TDoc extends { _id?: any }>(
  target: any,
  createInstanceFn: () => InstanceType<TDoc>,
): void {
  target.findById = vi.fn(async () => createInstanceFn())
  target.findOne = vi.fn(async () => createInstanceFn())
  target.findOneAndUpdate = vi.fn(async () => createInstanceFn())
  target.findOneAndDelete = vi.fn(async () => createInstanceFn())
  target.countDocuments = vi.fn().mockResolvedValue(0) as MockedFunction<(filter?: any) => Promise<number>>
}

function attachResetFunction(
  target: any,
  chainMocks: Record<MethodNames, MockedFunction<any>>,
  queryMocks: Record<string, MockedFunction<any>>,
): void {
  target.reset = () => {
    for (const m of Object.keys(chainMocks)) {
      chainMocks[m].mockClear()
      chainMocks[m].mockReset()
    }
    for (const m of ['findById', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'countDocuments'] as const) {
      const fn = target[m]
      if (typeof fn === 'function' && 'mockClear' in fn) {
        fn.mockClear()
        fn.mockReset?.()
      }
    }
    for (const m of Object.keys(queryMocks)) {
      queryMocks[m].mockClear()
      queryMocks[m].mockReset()
    }
  }
}

export function createMongooseModelMock<TDoc extends { _id?: any }>(
  name = 'MockModel',
  toObjectValue: Partial<TDoc> = {},
): ModelMock<TDoc> {
  const chainMocks = createMockFns()
  const queryMocks: Record<string, MockedFunction<any>> = {}

  const createInstanceFn = (doc?: Partial<TDoc>) => createInstance(toObjectValue, doc, chainMocks)

  const Model = vi.fn(function (doc?: Partial<TDoc>) {
    return createInstanceFn(doc)
  }) as unknown as { new (doc?: Partial<TDoc>): TDoc & InstanceType<TDoc> }

  Object.defineProperty(Model, 'name', { value: name })

  // Attach chainable static methods to the model itself
  for (const method of CHAINABLE_METHODS) {
    ;(Model as any)[method] = chainMocks[method]
  }

  // Attach query-like and finder methods
  attachQueryLikeMethods(Model, queryMocks)
  attachFinderMethods(Model, () => createInstanceFn())
  attachResetFunction(Model, chainMocks, queryMocks)

  return Model as ModelMock<TDoc>
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
