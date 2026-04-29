import AccessRequestModel from '../models/AccessRequest.js'
import ModelModel from '../models/Model.js'
import SchemaMigrationModel from '../models/SchemaMigration.js'
import WebhookModel from '../models/Webhook.js'

async function migrateCollection(model: any) {
  const docs = await model.find({ id: { $exists: true } }, null, { strict: false })

  let migrated = 0

  for (const doc of docs) {
    const oldId = doc.get('id')

    if (!oldId) {
      continue
    }

    const raw = doc.toObject({ depopulate: true })

    delete raw._id
    delete raw.id

    const newDoc = {
      ...raw,
      _id: oldId,
    }

    try {
      await model.collection.insertOne(newDoc)
      await model.deleteOne({ _id: doc._id })
      migrated++
    } catch (_err) {
      // If the document already exists with the new _id we skip it
      continue
    }
  }

  return migrated
}

export async function up() {
  const migratedModels = await migrateCollection(ModelModel)
  const migratedAccessRequests = await migrateCollection(AccessRequestModel)
  const migratedSchemaMigrations = await migrateCollection(SchemaMigrationModel)
  const migratedWebhooks = await migrateCollection(WebhookModel)

  return {
    migratedModels,
    migratedAccessRequests,
    migratedSchemaMigrations,
    migratedWebhooks,
  }
}

export async function down() {
  /* NOOP */
}
