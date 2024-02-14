import {
  AccessRequestInterface,
  ModelCardInterface,
  ModelInterface,
  ModelVisibility,
  ReviewComment,
  ReviewRequestInterface,
  ReviewResponse,
  Role,
  SchemaInterface,
  StepNoRender,
} from 'types/types'

/******** V2 ********/

const testEntity = 'user:user1'
const modelId = 'my-test-model'
const accessRequestSchemaId = 'my-request-schema'
const modelcardSchemaId = 'my-model-schema'

export const testAccessRequest: AccessRequestInterface = {
  id: 'my-access-request',
  modelId: modelId,
  schemaId: accessRequestSchemaId,
  deleted: false,
  comments: [],
  createdBy: testEntity,
  metadata: {
    overview: {
      name: 'My Access Request',
      endDate: new Date().toISOString(),
      entities: [testEntity],
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toDateString(),
}

const testComment: ReviewComment = {
  message: 'This is a comment',
  user: 'Joe Blogs',
  createdAt: new Date().toISOString(),
}

export const testAccessRequestWithComments: AccessRequestInterface = {
  id: 'my-access-request',
  modelId: modelId,
  schemaId: accessRequestSchemaId,
  deleted: false,
  comments: [testComment],
  createdBy: testEntity,
  metadata: {
    overview: {
      name: 'My Access Request',
      entities: [testEntity],
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toDateString(),
}

export const testModelCard: ModelCardInterface = {
  schemaId: modelcardSchemaId,
  metadata: {},
  version: 1,
  createdBy: testEntity,
}

export const testV2Model: ModelInterface = {
  id: modelId,
  name: 'My Model',
  description: 'This is a test model',
  visibility: ModelVisibility.Public,
  collaborators: [
    {
      entity: testEntity,
      roles: ['owner', 'msro', 'mtr'],
    },
  ],
  settings: {
    ungovernedAccess: false,
  },
  teamId: 'test-team',
  card: testModelCard,
  createdAt: new Date(),
  createdBy: testEntity,
}

export const testReviewResponse: ReviewResponse = {
  user: testEntity,
  decision: 'approve',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testAccessRequestReview: ReviewRequestInterface = {
  model: testV2Model,
  role: 'mrso',
  semver: '1.0.0',
  kind: 'access',
  responses: [testReviewResponse],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testReleaseReview: ReviewRequestInterface = {
  model: testV2Model,
  role: 'mrso',
  semver: '1.0.0',
  kind: 'release',
  responses: [testReviewResponse],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testAccessRequestReviewNoResponses: ReviewRequestInterface = {
  model: testV2Model,
  role: 'mrso',
  kind: 'access',
  responses: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  accessRequestId: 'my-access-request',
}
export const testReleaseReviewNoResponses: ReviewRequestInterface = {
  model: testV2Model,
  role: 'mrso',
  kind: 'release',
  responses: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  accessRequestId: 'my-release',
}

export const testAccessRequestSchema: SchemaInterface = {
  id: 'access-request-schema',
  name: 'Access request schema',
  description: '',
  active: true,
  hidden: false,
  kind: 'accessRequest',
  meta: {},
  uiSchema: {},
  schema: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      overview: {
        title: 'Details',
        type: 'object',
        properties: {
          name: {
            title: 'What is the name of the access request?',
            description:
              'This will be used to distinguish your access request from other access requests of this model',
            type: 'string',
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
    },
    required: ['overview'],
    additionalProperties: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testAccessRequestSchemaStepNoRender: StepNoRender = {
  schema: testAccessRequestSchema.schema,
  state: {},
  index: 0,
  steps: [],
  type: 'Form',
  section: 'First Page',
  schemaRef: testAccessRequestSchema.id,
  shouldValidate: false,
  isComplete: () => false,
}

export const testManagerRole: Role = {
  id: 'mngr',
  name: 'Manager',
}
