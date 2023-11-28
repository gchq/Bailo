import { ObjectId } from 'mongodb'

import ModelModel from '../models/v2/Model.js'
import { model } from './data/models.js'
import { seed } from './index.js'

export default async function PrivateModel() {
  await seed(ModelModel, {
    _id: new ObjectId('300000000000000000000000'),
    ...model,
    id: 'private-model-abcdef',
    name: 'Private Model',
    description:
      'This model is private, but the default user has access to it.  You should be able to see this model.  This model also has an incredibly long description, just to make sure that our application can cope with it.  This is despite the fact we generally promote descriptions being a single sentence.',
    visibility: 'private',
  })
}
