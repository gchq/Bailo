import authentication from '../connectors/authentication/index.js'
import ModelModel from '../models/Model.js'
import log from '../services/log.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

async function script() {
  await connectToMongoose()
  const models = await ModelModel.find({ collaborators: { $elemMatch: { roles: 'msro' } } })
  const msroInformation: {
    [x: string]: { email?: string; models: number }
  } = {}

  for (const model of models) {
    const modelMSROs = (
      await Promise.all(
        model.collaborators
          .filter((collaborator) => collaborator.roles.includes('msro'))
          .map((collaborator) => collaborator.entity)
          .map(async (entity) => {
            return await authentication.getEntityMembers(entity)
          }),
      )
    ).flat()

    for (const entity of modelMSROs) {
      if (msroInformation[entity]) {
        msroInformation[entity].models++
      } else {
        msroInformation[entity] = {
          email: (await authentication.getUserInformation(entity)).email,
          models: 1,
        }
      }
    }
  }
  log.info(msroInformation)
  setTimeout(disconnectFromMongoose, 50)
}

script()
