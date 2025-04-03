import authentication from '../connectors/authentication/index.js'
import { MigrationMetadata } from '../models/Migration.js'
import ModelModel from '../models/Model.js'

/**
 * As we now do backend validation for users being added to model access lists, we
 * added this script to find and remove all existing users that do not pass the
 * "getUserInformation" call in the authentication connector. You can find a
 * list of removed users for all affected models by looking at the "metadata"
 * property of this migration's database object.
 **/

export async function up() {
  const models = await ModelModel.find({})
  const metadata: MigrationMetadata[] = []
  for (const model of models) {
    const invalidUsers: string[] = []
    await Promise.all(
      model.collaborators.map(async (collaborator) => {
        if (collaborator.entity !== '') {
          try {
            await authentication.getUserInformation(collaborator.entity)
          } catch (_err) {
            invalidUsers.push(collaborator.entity)
          }
        }
      }),
    )
    if (invalidUsers.length > 0) {
      const invalidUsersForModel = { modelId: model.id, invalidUsers: invalidUsers }
      const invalidUsersRemoved = model.collaborators.filter(
        (collaborator) => !invalidUsers.includes(collaborator.entity),
      )
      model.collaborators = invalidUsersRemoved
      await model.save()
      metadata.push(invalidUsersForModel)
    }
  }
  return metadata
}

export async function down() {
  /* NOOP */
}
