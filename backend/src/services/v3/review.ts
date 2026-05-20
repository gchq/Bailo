import { Types } from 'mongoose'

import ReviewModel, { ReviewDoc } from '../../models/Review.js'
import { UserInterface } from '../../models/User.js'
import { NotFound } from '../../utils/error.js'
import { getModelById } from '../model.js'
import { findUserInCollaborators } from '../review.js'

// v3 function for retrieving a review using the id
export async function findReviewById(user: UserInterface, modelId: string, reviewId: string, role: string) {
  // Authorisation check to make sure the user can access a model
  await getModelById(user, modelId)

  const review: ReviewDoc = (
    await ReviewModel.aggregate()
      .match({
        modelId,
        _id: new Types.ObjectId(reviewId),
        role,
      })
      .sort({ createdAt: -1 })
      // Populate model entries
      .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
      // Populate model as value instead of array
      .unwind({ path: '$model' })
      .match(await findUserInCollaborators(user))
      .limit(1)
  ).at(0)
  if (!review) {
    throw NotFound(`Unable to find Review to respond to.`, { modelId, reviewId, role })
  }

  return review
}
