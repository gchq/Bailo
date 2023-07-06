import { ObjectId } from 'mongodb'
import { TextEncoder } from 'util'

import UserModel from '../../models/User.js'
import { ApprovalCategory, ApprovalStates, ApprovalTypes, EntityKind } from '../../types/types.js'

global.TextEncoder = TextEncoder

export const deploymentUuid = 'test-deployment'
export const requesterId = new ObjectId()
export const modelId = new ObjectId()
export const modelUuid = 'test-model'
export const versionId = new ObjectId()
export const version2Id = new ObjectId()

export const uploadData: any = {
  schemaRef: 'test-schema3',
  highLevelDetails: {
    name: 'test-deployment',
    modelID: 'test-model',
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
}

export const deploymentData: any = {
  schemaRef: 'test-schema3',
  highLevelDetails: {
    name: 'test-deployment',
    modelID: 'test-model',
  },
  contacts: {
    owner: [
      {
        kind: EntityKind.USER,
        id: 'user',
      },
    ],
  },
}

export const testUser: any = {
  _id: new ObjectId(),
  id: 'user',
  email: 'test@example.com',
  roles: ['user'],
}

export const userDoc = new UserModel(testUser)

export const testUser2: any = {
  id: 'user2',
  email: 'test2',
  roles: ['user'],
}

export const testManager: any = {
  id: 'manager',
  email: 'test3',
}

export const testReviewer: any = {
  id: 'reviewer',
  email: 'test4',
}

export const managerApproval: any = {
  _id: 'managerId',
}

export const deploymentSchema: any = {
  name: 'deployment-schema',
  reference: 'test-schema3',
  use: 'DEPLOYMENT',
  schema: {},
}

export const uploadSchema: any = {
  name: 'upload-schema',
  reference: 'test-schema',
  use: 'UPLOAD',
  schema: {
    testProperty: '',
  },
}

export const uploadSchema2: any = {
  name: 'upload-schema2',
  reference: 'test-schema2',
  use: 'UPLOAD',
  schema: {},
}

export const testModelUpload: any = {
  highLevelDetails: {
    name: modelUuid,
    modelInASentence: 'Test Model',
    modelOverview: 'Test Model',
    modelCardVersion: 'Model Card Overview',
    tags: ['tag1', 'tag2'],
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
    uploadType: 'Code and binaries',
  },
  schemaRef: '/Minimal/General/v10',
}

export const testModel: any = {
  _id: modelId,
  versions: [],
  schemaRef: 'test-schema',
  uuid: modelUuid,
  latestVersion: versionId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testModel2: any = {
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'model-test2',
  latestVersion: versionId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testVersion: any = {
  _id: versionId,
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
  managerApproved: ApprovalStates.Accepted,
  reviewerApproved: ApprovalStates.NoResponse,
  state: {},
  logs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testVersion2: any = {
  _id: version2Id,
  model: testModel,
  version: '2',
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
  built: true,
  managerApproved: ApprovalStates.Accepted,
  reviewerApproved: ApprovalStates.NoResponse,
  state: {},
  logs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testDeployment: any = {
  managerApproved: ApprovalStates.Accepted,
  built: false,
  schemaRef: 'test-schema3',
  uuid: deploymentUuid,
  model: modelId,
  metadata: deploymentData,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testDeployment2: any = {
  managerApproved: ApprovalStates.NoResponse,
  built: false,
  schemaRef: 'test-schema3',
  uuid: deploymentUuid,
  model: modelId,
  metadata: {
    contacts: {
      owner: [
        {
          kind: EntityKind.USER,
          id: 'user',
        },
      ],
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testApproval: any = {
  status: ApprovalStates.NoResponse,
  approvalType: ApprovalTypes.Manager,
  approvalCategory: ApprovalCategory.Upload,
  version: undefined,
  __v: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}
