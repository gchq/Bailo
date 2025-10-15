import ReleaseModel from '../models/Release.js'
import Review, { ReviewDoc } from '../models/Review.js'
import { removeResponses } from '../services/response.js'

// Fix for 020_2426_remove_orphaned_reviews_responses.ts failing part way through
export async function up() {
  // Find all releases have already been marked as deleted
  const deletedReleases = await ReleaseModel.find({ deleted: true })
  const deletedReviews: ReviewDoc[] = []

  // For each deleted release, find the already deleted reviews (from 020_2426_remove_orphaned_reviews_responses.ts) associated with it
  for (const { modelId, semver } of deletedReleases) {
    const reviews: ReviewDoc[] = await Review.find({
      modelId,
      semver,
      deleted: true,
    })
    deletedReviews.push(...reviews)
  }

  // Rest of script as in 020_2426_remove_orphaned_reviews_responses.ts
  const reviewIds = deletedReviews.map((r) => r.id)
  // For each deleted review, delete the responses associated with it
  const deletedResponses = await removeResponses(reviewIds)

  // Store some basic metadata about the migration
  return {
    foundDeletedReleases: deletedReleases.length,
    deletedReleaseReviews: deletedReviews.length,
    deletedResponses: deletedResponses.length,
  }
}

export async function down() {
  /* NOOP */
  // In theory we could save off the deleted items to metadata as they're only soft-deleted,
  // but there's no parent review anyway
}
