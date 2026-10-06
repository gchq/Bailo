import humanInterval from 'human-interval'

import ReviewModel from '../models/Review.js'
import { ReviewKind } from '../types/enums.js'
import config from '../utils/config.js'

export async function up() {
  const dateInterval = humanInterval(config.ui.lifecycle.maxReviewInterval)
  if (!dateInterval) {
    return
  }

  const maxDate = new Date(Date.now() + dateInterval)
  const reviews = await ReviewModel.find({ kind: ReviewKind.Lifecycle, dueDate: { $gt: maxDate } })

  const modifiedReviews: { modelId: string; previousDueDate: Date }[] = []
  for (const review of reviews) {
    // safe cast as we know the date exists from the earlier query
    const previousDueDate = review.dueDate as Date
    review.dueDate = maxDate
    await review.save()
    modifiedReviews.push({ modelId: review.modelId, previousDueDate })
  }

  return { maxDate, modifiedReviews }
}

export async function down() {
  /* NOOP */
}
