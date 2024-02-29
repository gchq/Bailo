import { ObjectId } from 'mongodb'
import { Model, UpdateQuery } from 'mongoose'

import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import log from '../utils/logger.js'
import BasicModel from './basic.js'
import DisableUngovernedModel from './disable_ungoverned.js'
import InvalidModel from './invalid.js'
import NoCardModel from './no_card.js'
import PrivateModel from './private.js'

export async function seedAll() {
  await connectToMongoose()

  await NoCardModel()
  await DisableUngovernedModel()
  await InvalidModel()
  await PrivateModel()
  await BasicModel()

  log.info('Seeded example models')

  setTimeout(disconnectFromMongoose, 50)
}

export async function seed<T extends UpdateQuery<T>>(model: Model<T>, document: T & { _id: ObjectId }) {
  await model.updateOne({ _id: document._id }, document, { upsert: true })
  return document
}

seedAll()
