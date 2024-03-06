import { ObjectId } from 'mongodb'

import AccessRequestModel from '../models/AccessRequest.js'
import ModelModel from '../models/Model.js'
import ReleaseModel from '../models/Release.js'
import { accessRequest as baseAccessRequest, model as baseModel, release as baseRelease } from './data/models.js'
import { seed } from './index.js'

export default async function BasicModel() {
  const model = await seed(ModelModel, {
    _id: new ObjectId('100000000000000000000000'),
    ...baseModel,
  })

  await seed(ReleaseModel, {
    _id: new ObjectId('100000000000000000000001'),
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,
  })

  await seed(ReleaseModel, {
    _id: new ObjectId('100000000000000000000004'),
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,
    notes: `This is a minor release, with a far shorter set of notes.  Maybe this fixes some bugs.`,

    minor: true,
    semver: 'v1.0.1',
  })

  await seed(ReleaseModel, {
    _id: new ObjectId('100000000000000000000005'),
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,
    notes: `This is a minor release, with a far shorter set of notes.  Maybe this fixes some bugs.`,

    minor: true,
    semver: 'v1.0.2',
  })

  await seed(ReleaseModel, {
    _id: new ObjectId('100000000000000000000002'),
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,

    semver: 'v2.0.0',
  })

  await seed(ReleaseModel, {
    _id: new ObjectId('100000000000000000000003'),
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,
    notes: `This is a minor release, with a far shorter set of notes.  Maybe this fixes some bugs.`,

    minor: true,
    semver: 'v2.0.1',
  })

  await seed(AccessRequestModel, {
    _id: new ObjectId('100000000000000000000010'),
    ...baseAccessRequest,

    id: 'our-access-request-abcdef',
    modelId: model.id,
  })

  await seed(AccessRequestModel, {
    _id: new ObjectId('100000000000000000000020'),
    ...baseAccessRequest,

    id: 'another-access-request-abcdef',
    modelId: model.id,

    metadata: {
      overview: {
        name: 'Other Access Request',
        endDate: '2029-11-19',
        entities: ['user2', 'user3', 'user4'],
      },
    },
  })

  await seed(AccessRequestModel, {
    _id: new ObjectId('100000000000000000000030'),
    ...baseAccessRequest,

    id: 'deleted-access-request-abcdef',
    modelId: model.id,

    deleted: true,
  })
}
