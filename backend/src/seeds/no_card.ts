import ModelModel from '../models/Model.js'
import { model } from './data/models.js'
import { seed } from './index.js'

export default async function NoCardModel() {
  await seed(ModelModel, {
    ...model,
    _id: 'no-card-model-abcdef',
    name: 'No Card',
    description: 'This model has not been fully setup yet.',
    visibility: 'public',
  })
}
