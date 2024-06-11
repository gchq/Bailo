import { UserInformation } from 'src/common/UserDisplay'
import {
  AccessRequestInterface,
  EntryCardInterface,
  EntryInterface,
  EntryKind,
  EntryVisibility,
  ResponseInterface,
  ResponseKind,
  ReviewRequestInterface,
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
  _id: '123125123',
  id: 'my-access-request',
  modelId: modelId,
  schemaId: accessRequestSchemaId,
  deleted: false,
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

export const testComment: ResponseInterface = {
  comment: 'This is a comment',
  entity: 'Joe Blogs',
  kind: ResponseKind.Comment,
  parentId: '22626234234234',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testAccessRequestWithComments: AccessRequestInterface = {
  _id: '123125123',
  id: 'my-access-request',
  modelId: modelId,
  schemaId: accessRequestSchemaId,
  deleted: false,
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

export const testModelCard: EntryCardInterface = {
  schemaId: modelcardSchemaId,
  metadata: {},
  version: 1,
  createdBy: testEntity,
}

export const testV2Model: EntryInterface = {
  id: modelId,
  kind: EntryKind.MODEL,
  name: 'My Model',
  description: 'This is a test model',
  visibility: EntryVisibility.Public,
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

export const testReviewResponse: ResponseInterface = {
  parentId: '123125123',
  entity: testEntity,
  decision: 'approve',
  role: 'mtr',
  kind: ResponseKind.Review,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testAccessRequestReview: ReviewRequestInterface = {
  _id: '123125123',
  model: testV2Model,
  role: 'mrso',
  semver: '1.0.0',
  kind: 'access',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testReleaseReview: ReviewRequestInterface = {
  _id: '123125123',
  model: testV2Model,
  role: 'mrso',
  semver: '1.0.0',
  kind: 'release',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testAccessRequestReviewNoResponses: ReviewRequestInterface = {
  _id: '123125123',
  model: testV2Model,
  role: 'mrso',
  kind: 'access',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  accessRequestId: 'my-access-request',
}
export const testReleaseReviewNoResponses: ReviewRequestInterface = {
  _id: '123125123',
  model: testV2Model,
  role: 'mrso',
  kind: 'release',
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

export const testUserInformation: UserInformation = {
  name: 'Joe Bloggs',
  email: 'test@example.com',
  birthday: '2/2/22',
}
