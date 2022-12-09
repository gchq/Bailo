import { TextEncoder } from 'util'
import { ObjectId } from 'mongodb'
import { ApprovalStates, EntityKind } from '../../../types/interfaces'
import UserModel from '../../models/User'

global.TextEncoder = TextEncoder

export const deploymentUuid = 'test-deployment'
export const requesterId = new ObjectId()
export const modelId = new ObjectId()
export const modelUuid = 'test-model'

export const uploadData: any = {
  schemaRef: 'test-schema3',
  highLevelDetails: {
    initialVersionRequested: 1,
    name: 'test-deployment',
    modelID: 'test-model',
  },
  contacts: {
    uploader: [{ kind: EntityKind.USER, id: 'user' }],
    reviewer: [{ kind: EntityKind.USER, id: 'reviewer' }],
    manager: [{ kind: EntityKind.USER, id: 'manager' }],
  },
}

export const deploymentData: any = {
  schemaRef: 'test-schema3',
  highLevelDetails: {
    initialVersionRequested: 1,
    name: 'test-deployment',
    modelID: 'test-model',
  },
  contacts: {
    owner: [{ kind: EntityKind.USER, id: 'user' }],
  },
}

export const testUser: any = {
  id: 'user',
  email: 'test@example.com',
}
export const userDoc = new UserModel(testUser)

export const testUser2: any = {
  id: 'user2',
  email: 'test2',
}

export const testManager: any = {
  id: 'manager',
  email: 'test3',
}

export const testReviewer: any = {
  id: 'reviewer',
  email: 'test4',
}

export const managerRequest: any = {
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

export const testVersion: any = {
  model: modelId,
  version: '1',
  metadata: {
    highLevelDetails: {
      name: 'test',
    },
    contacts: {
      uploader: [{ kind: EntityKind.USER, id: 'user' }],
      reviewer: [{ kind: EntityKind.USER, id: 'reviewer' }],
      manager: [{ kind: EntityKind.USER, id: 'manager' }],
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
  model: modelId,
  version: '2',
  metadata: {
    highLevelDetails: {
      name: 'test',
    },
    contacts: {
      uploader: [{ kind: EntityKind.USER, id: 'user' }],
      reviewer: [{ kind: EntityKind.USER, id: 'reviewer' }],
      manager: [{ kind: EntityKind.USER, id: 'manager' }],
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

export const testModel: any = {
  _id: modelId,
  versions: [],
  schemaRef: 'test-schema',
  uuid: modelUuid,
  currentMetadata: uploadData,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testModel2: any = {
  versions: [],
  schemaRef: 'test-schema',
  uuid: 'model-test2',
  currentMetadata: uploadData,
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
      owner: [{ kind: EntityKind.USER, id: 'user' }],
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const testRequest: any = {
  status: 'No Response',
  approvalType: 'Manager',
  request: 'Upload',
  version: null,
  __v: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}
