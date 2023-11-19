import { cloneDeep, merge } from 'lodash-es'
import { ObjectId } from 'mongodb'

import AccessRequestModel, { AccessRequestInterface } from '../../models/v2/AccessRequest.js'
import { ModelInterface } from '../../models/v2/Model.js'
import { seed } from '../index.js'

type FakeAccessRequest = AccessRequestInterface & { _id: ObjectId }

const basicAccessRequest: FakeAccessRequest = {
  _id: new ObjectId('000000000000000000002000'),
  id: 'basic-access-request-abcdef',
  modelId: '',

  schemaId: 'minimal-access-request-general-v10-beta',
  metadata: {
    overview: {
      name: 'Basic access request',
      entities: ['user:user', 'user:user2'],
    },
  },

  deleted: false,

  createdBy: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export async function seedAccessRequests(model: ModelInterface) {
  const accessRequests = [
    merge(cloneDeep(basicAccessRequest), {
      _id: new ObjectId('000000000000000000002001'),
      id: 'basic-access-request-abcdef',
      modelId: model.id,

      metadata: {
        overview: {
          name: 'Basic access request',
        },
      },
    }),
    merge(cloneDeep(basicAccessRequest), {
      _id: new ObjectId('000000000000000000002002'),
      id: 'deleted-access-request-abcdef',
      modelId: model.id,

      metadata: {
        overview: {
          name: 'Deleted access request',
        },
      },

      deleted: false,
    }),
    merge(cloneDeep(basicAccessRequest), {
      _id: new ObjectId('000000000000000000002003'),
      id: 'other-access-request-abcdef',
      modelId: model.id,

      metadata: {
        overview: {
          name: 'Other Access Request',
          entities: ['user:other', 'user:different'],
        },
      },

      deleted: false,
    }),
  ]

  seed(AccessRequestModel, accessRequests)
}
