import ModelModel from '../models/Model.js'
import ReleaseModel from '../models/Release.js'
import { createReleaseReviews } from '../services/review.js'

export async function up() {
  const missingPublishedReleaseReviews = await ReleaseModel.aggregate<{
    _id: string
    modelId: string
    semver: string
  }>([
    { $match: { draft: false } },
    {
      $addFields: {
        semverString: {
          $concat: [
            { $toString: '$semver.major' },
            '.',
            { $toString: '$semver.minor' },
            '.',
            { $toString: '$semver.patch' },
            {
              $cond: [{ $ifNull: ['$semver.metadata', false] }, { $concat: ['-', '$semver.metadata'] }, ''],
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'v2_reviews',
        let: { modelId: '$modelId', semver: '$semverString' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$modelId', '$$modelId'] },
                  { $eq: ['$semver', '$$semver'] },
                  { $eq: ['$kind', 'release'] },
                ],
              },
            },
          },
        ],
        as: 'matchedReviews',
      },
    },
    { $addFields: { reviewCount: { $size: '$matchedReviews' } } },
    { $match: { reviewCount: 0 } },
    { $project: { _id: 1, modelId: 1, semver: '$semverString' } },
  ])

  await Promise.all(
    missingPublishedReleaseReviews.map(async ({ modelId, semver }) => {
      const model = await ModelModel.findOne({ id: modelId }).lean()
      const release = await ReleaseModel.findOne({ modelId, semver })
      if (model && release) {
        await createReleaseReviews(model, release)
      }
    }),
  )
}

export async function down() {
  /* NOOP */
}
