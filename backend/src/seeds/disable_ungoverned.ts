import { ObjectId } from 'mongodb'

import ModelModel from '../models/Model.js'
import { model } from './data/models.js'
import { seed } from './index.js'

export default async function DisableUngovernedModel() {
  await seed(ModelModel, {
    _id: new ObjectId('400000000000000000000000'),
    ...model,
    id: 'no-ungoverned-model-abcdef',
    name: 'No Ungoverened Model',
    description:
      'This model does not allow ungoverned access, users should create an access request to get the artefacts from this.',
    settings: {
      ungovernedAccess: false,
    },
  })
}
