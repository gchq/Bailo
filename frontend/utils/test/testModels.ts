import {
  AccessRequestInterface,
  ModelVisibility,
  ReviewRequestInterface,
  ReviewResponse,
  StepNoRender,
} from 'types/interfaces'
import { ModelCardInterface, ModelInterface } from 'types/v2/types'

import {
  ApprovalCategory,
  ApprovalStates,
  ApprovalTypes,
  EntityKind,
  ReviewComment,
  SchemaInterface,
} from '../../types/types'

export const testId = 'testId'

export const testUser: any = {
  _id: 'testUserId',
  id: 'user',
  email: 'test@example.com',
  roles: ['user'],
}

export const testModel: any = {
  _id: 'testModelId',
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'testModelUuid',
  latestVersion: 'testVersionId',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testVersion: any = {
  _id: 'testVersionId',
  model: testModel,
  version: '1',
  metadata: {
    highLevelDetails: {
      name: 'test',
    },
    contacts: {
      uploader: [
        {
          kind: EntityKind.USER,
          id: 'user',
        },
      ],
      reviewer: [
        {
          kind: EntityKind.USER,
          id: 'reviewer',
        },
      ],
      manager: [
        {
          kind: EntityKind.USER,
          id: 'manager',
        },
      ],
    },
    buildOptions: {
      seldonVersion: 'seldonio/seldon-core-s2i-python37:1.10.0',
    },
  },
  files: {
    rawCodePath: '',
    rawBinaryPath: '',
  },
  built: false,
  managerApproved: ApprovalStates.NoResponse,
  reviewerApproved: ApprovalStates.NoResponse,
  state: {},
  logs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testApproval1: any = {
  _id: 'testApprovalId1',
  version: testVersion,
  approvers: [
    {
      kind: EntityKind.USER,
      id: 'testUserId',
    },
  ],
  status: ApprovalStates.NoResponse,
  approvalType: ApprovalTypes.Reviewer,
  approvalCategory: ApprovalCategory.Upload,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testApproval2: any = {
  ...testApproval1,
  _id: 'testApprovalId2',
  approvalType: ApprovalTypes.Manager,
}

export const testApproval3: any = {
  ...testApproval1,
  _id: 'testApprovalId3',
  status: ApprovalStates.Accepted,
}

export const testApproval4: any = {
  ...testApproval2,
  _id: 'testApprovalId4',
  status: ApprovalStates.Accepted,
}

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
  kind: 'release',
  responses: [testReviewResponse],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
