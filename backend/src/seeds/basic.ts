import AccessRequestModel from '../models/AccessRequest.js'
import ModelModel from '../models/Model.js'
import ReleaseModel from '../models/Release.js'
import { accessRequest as baseAccessRequest, model as baseModel, release as baseRelease } from './data/models.js'
import { seed } from './index.js'

export default async function BasicModel() {
  const model = await seed(ModelModel, {
    ...baseModel,
  })

  await seed(ReleaseModel, {
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,
  })

  await seed(ReleaseModel, {
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,
    notes: `This is a minor release, with a far shorter set of notes.  Maybe this fixes some bugs.`,

    minor: true,
    semver: 'v1.0.1',
  })

  await seed(ReleaseModel, {
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,
    notes: `This is a minor release, with a far shorter set of notes.  Maybe this fixes some bugs.`,

    minor: true,
    semver: 'v1.0.2',
  })

  await seed(ReleaseModel, {
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,

    semver: 'v2.0.0',
  })

  await seed(ReleaseModel, {
    ...baseRelease,

    modelId: model.id,
    modelCardVersion: model.card?.version as unknown as number,
    notes: `This is a minor release, with a far shorter set of notes.  Maybe this fixes some bugs.`,

    minor: true,
    semver: 'v2.0.1',
  })

  await seed(AccessRequestModel, {
    ...baseAccessRequest,

    _id: 'our-access-request-abcdef',
    modelId: model.id,
  })

  await seed(AccessRequestModel, {
    ...baseAccessRequest,

    _id: 'another-access-request-abcdef',
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
    ...baseAccessRequest,

    _id: 'deleted-access-request-abcdef',
    modelId: model.id,

    deleted: true,
  })
}
