import { ApprovalCategory, ApprovalStates, ApprovalTypes, EntityKind } from '../../types/types'

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
