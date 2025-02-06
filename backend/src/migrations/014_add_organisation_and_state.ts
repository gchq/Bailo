import ModelModel from '../models/Model.js'

export async function up() {
  await ModelModel.updateMany({ organisation: { $exists: false } }, { $set: { organisation: '' } })
  await ModelModel.updateMany({ state: { $exists: false } }, { $set: { state: '' } })
  //   for (const model of models) {
  //     const organisation = model.get('organisation')
  //     if (organisation === undefined) {
  //       model.set('organisation', '')
  //       await model.save()
  //     }
  //     const state = model.get('state')
  //     if (state === undefined) {
  //       model.set('state', '')
  //       await model.save()
  //     }
  //   }
}

export async function down() {
  /* NOOP */
}
