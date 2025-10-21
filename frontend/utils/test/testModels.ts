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
  ReviewRoleInterface,
  RoleKind,
  SchemaInterface,
  StepNoRender,
  SystemRole,
  UiConfig,
} from 'types/types'

/******** V2 ********/

const testEntity = 'user:user1'
const modelId = 'my-test-model'
const accessRequestSchemaId = 'my-request-schema'
const modelCardSchemaId = 'my-model-schema'
const testAccessRequestId = '12315123'

export const testAccessRequest: AccessRequestInterface = {
  _id: testAccessRequestId,
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
  _id: '125151231231',
  comment: 'This is a comment',
  entity: 'Joe Blogs',
  kind: ResponseKind.Comment,
  parentId: '22626234234234',
  reactions: [],
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
  schemaId: modelCardSchemaId,
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
  tags: [],
  collaborators: [
    {
      entity: testEntity,
      roles: ['owner', 'msro', 'mtr'],
    },
  ],
  settings: {
    ungovernedAccess: false,
    allowTemplating: false,
  },
  card: testModelCard,
  createdAt: new Date(),
  createdBy: testEntity,
}

export const testReviewResponse: ResponseInterface = {
  _id: '125151231233',
  parentId: '123125123',
  entity: testEntity,
  decision: 'approve',
  role: 'mtr',
  kind: ResponseKind.Review,
  reactions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testAccessRequestReview: ReviewRequestInterface = {
  _id: '123125123',
  model: testV2Model,
  role: 'msro',
  semver: '1.0.0',
  kind: 'access',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testReleaseReview: ReviewRequestInterface = {
  _id: '123125123',
  model: testV2Model,
  role: 'msro',
  semver: '1.0.0',
  kind: 'release',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const testAccessRequestReviewNoResponses: ReviewRequestInterface = {
  _id: '123125123',
  model: testV2Model,
  role: 'msro',
  kind: 'access',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  accessRequestId: 'my-access-request',
}
export const testReleaseReviewNoResponses: ReviewRequestInterface = {
  _id: '123125123',
  model: testV2Model,
  role: 'msro',
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
  jsonSchema: {
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
  reviewRoles: ['msro'],
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testAccessRequestSchemaStepNoRender: StepNoRender = {
  schema: testAccessRequestSchema.jsonSchema,
  state: {},
  index: 0,
  steps: [],
  type: 'Form',
  section: 'First Page',
  schemaRef: testAccessRequestSchema.id,
  shouldValidate: false,
  isComplete: () => false,
}

export const testManagerRole: SystemRole = {
  name: 'Manager',
  shortName: 'manager',
  systemRole: 'owner',
}

export const testManagerRoleInterface: ReviewRoleInterface = {
  ...testManagerRole,
  _id: '12415234234',
  kind: RoleKind.REVIEW,
  systemRole: 'consumer',
  createdAt: '',
  updatedAt: '',
}

export const testUiConfig: UiConfig = {
  banner: {
    enabled: true,
    text: 'DEVELOPMENT DEPLOYMENT',
    colour: 'orange',
    textColor: 'black',
  },

  // Contact details for the support team
  issues: {
    label: 'Bailo Support Team',
    supportHref: 'mailto:hello@example.com?subject=Bailo%20Support',
    contactHref: 'mailto:hello@example.com?subject=Bailo%20Contact',
  },

  // The publicly accessible location of the registry, including host and port
  registry: {
    host: 'localhost:8080',
  },

  inference: {
    enabled: false,
    connection: {
      host: 'http://example.com',
    },
    authorizationTokenName: 'inferencing-token',
    gpus: {},
  },
  modelMirror: {
    import: {
      enabled: false,
    },
    export: {
      enabled: false,
      disclaimer: '## Example Agreement \n I agree that this model is suitable for exporting',
    },
  },

  announcement: {
    enabled: false,
    text: '',
    startTimestamp: '',
  },

  helpPopoverText: {
    manualEntryAccess: '',
  },

  modelDetails: {
    organisations: ['Example Organisation'],
    states: ['Development', 'Review', 'Production'],
  },

  roleDisplayNames: {
    owner: 'Model Developer',
    contributor: 'Contributor',
    consumer: 'Consumer',
  },
  development: {
    logUrl: '',
  },
}

export const testUserInformation: UserInformation = {
  name: 'Joe Bloggs',
  email: 'test@example.com',
  birthday: '2/2/22',
}
