import FileModel from '../models/File.js'
import Model from '../models/Model.js'

export async function up() {
  await Model.updateMany(
    {
      tags: { $exists: true, $type: 'array' },
      'tags.0': { $exists: true },
    },
    [
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
    ],
  )

  await FileModel.updateMany(
    {
      tags: { $exists: true, $type: 'array' },
      'tags.0': { $exists: true },
    },
    [
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
    ],
  )
}

export async function down() {}
