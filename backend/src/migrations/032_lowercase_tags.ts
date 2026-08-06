import FileModel from '../models/File.js'
import Model from '../models/Model.js'

export async function up() {
  const lowercaseTagsPipeline = [
    {
      $set: {
        tags: {
          $setUnion: [
            {
              $map: {
                input: '$tags',
                as: 'tag',
                in: { $toLower: '$$tag' },
              },
            },
          ],
        },
      },
    },
  ]
  await Model.updateMany(
    { tags: { $exists: true, $type: 'array' }, 'tags.0': { $exists: true } },
    lowercaseTagsPipeline,
    { updatePipeline: true },
  )
  await FileModel.updateMany(
    { tags: { $exists: true, $type: 'array' }, 'tags.0': { $exists: true } },
    lowercaseTagsPipeline,
    { updatePipeline: true },
  )
}

export async function down() {}
