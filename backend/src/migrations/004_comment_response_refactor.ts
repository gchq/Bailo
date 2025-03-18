import AccessRequestModel from '../models/AccessRequest.js'
import ReleaseModel from '../models/Release.js'
import ResponseModel, { ResponseKind } from '../models/Response.js'
import ReviewModel from '../models/Review.js'

export async function up() {
  // Resolve release comments
  const releases = await ReleaseModel.find({})
  for (const release of releases) {
    if (release['comments'] !== undefined) {
      for (const releaseComment of release['comments']) {
        const username = releaseComment.user.includes(':') ? releaseComment.user : `user:${releaseComment.user}`
        const newComment = new ResponseModel({
          entity: username,
          kind: ResponseKind.Comment,
          comment: releaseComment.message,
          parentId: release._id,
          createdAt: releaseComment.createdAt,
          updatedAt: releaseComment.createdAt,
        })
        await newComment.save()
      }
      await release.save()
    }
  }

  // Resolve access request comments
  const accessRequests = await AccessRequestModel.find({})
  for (const accessRequest of accessRequests) {
    if (accessRequest['comments'] !== undefined) {
      for (const accessComment of accessRequest['comments']) {
        const username = accessComment.user.includes(':') ? accessComment.user : `user:${accessComment.user}`
        const newComment = new ResponseModel({
          entity: username,
          kind: ResponseKind.Comment,
          comment: accessComment.message,
          parentId: accessRequest._id,
          createdAt: accessComment.createdAt,
          updatedAt: accessComment.createdAt,
        })
        await newComment.save()
      }
      await accessRequest.save()
    }
  }

  // Resolve review comments
  const reviews = await ReviewModel.find({})
  for (const review of reviews) {
    if (review['responses'] !== undefined) {
      for (const reviewResponse of review['responses']) {
        const username = reviewResponse.user.includes(':') ? reviewResponse.user : `user:${reviewResponse.user}`
        const newComment = new ResponseModel({
          entity: username,
          kind: ResponseKind.Review,
          comment: reviewResponse.comment,
          role: review.role,
          decision: reviewResponse.decision,
          parentId: review._id,
          createdAt: reviewResponse.createdAt,
          updatedAt: reviewResponse.createdAt,
        })
        await newComment.save()
      }
      await review.save()
    }
  }
}

export async function down() {
  /* NOOP */
}
