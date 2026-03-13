import ModelCardRevisionModel from '../models/ModelCardRevision.js'

export async function up() {
  const revisionsWithTags = await ModelCardRevisionModel.find({ 'metadata.overview.tags': { $exists: true } })
  for (const revision of revisionsWithTags) {
    if (revision && revision.metadata.overview) {
      revision.set('metadata.overview.tags', undefined, { strict: false })
      await revision.save()
    }
  }
}

export async function down() {}
