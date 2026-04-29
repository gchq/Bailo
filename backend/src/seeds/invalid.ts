import ModelModel from '../models/Model.js'
import { model } from './data/models.js'
import { seed } from './index.js'

export default async function InvalidModel() {
  await seed(ModelModel, {
    ...model,
    _id: 'invalid-model-abcdef',
    name: 'INVALID MODEL',
    description: 'This model is private and there are no assigned users.  YOU SHOULD NEVER SEE THIS MODEL.',
    collaborators: [],
    visibility: 'private',
  })
}
