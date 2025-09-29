import ModelModel, { EntryKind } from '../models/Model.js'

export async function up() {
  await ModelModel.updateMany(
    { 'settings.mirror.sourceModelId': { $exists: true } },
    { kind: EntryKind.MirroredModel },
    { strict: false },
  )
}

export async function down() {
  /* NOOP */
}
