import FileModel from '../models/File.js'
import Model from '../models/Model.js'

export async function up() {
  const query = { tags: { $exists: true, $type: 'array' }, 'tags.0': { $exists: true } }
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
  await Model.updateMany(query, lowercaseTagsPipeline)
  await FileModel.updateMany(query, lowercaseTagsPipeline)
}

export async function down() {}
