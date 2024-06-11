import AccessRequestModel from '../models/AccessRequest.js'
import ReleaseModel from '../models/Release.js'
import ResponseModel, { ResponseKind } from '../models/Response.js'
import ReviewModel from '../models/Review.js'
import { toEntity } from '../utils/entity.js'

export async function up() {
  // Resolve release comments
  const releases: any = await ReleaseModel.find({})
  for (const release of releases) {
    release.commentIds = []
    if (release.get('comments') !== undefined) {
      for (const releaseComment of release.get('comments')) {
        const username = !releaseComment.user.includes(':')
          ? toEntity('user', releaseComment.user)
          : releaseComment.user
        const newComment = new ResponseModel({
          user: username,
          kind: ResponseKind.Comment,
          comment: releaseComment.message,
          parentId: release._id,
          createdAt: releaseComment.createdAt,
          updatedAt: releaseComment.createdAt,
        })
        await newComment.save()
        release.commentIds.push(newComment._id)
        //release.set('comments', undefined, { strict: false })
      }
      await release.save()
    }
  }

  // Resolve access request comments
  const accessRequests: any = await AccessRequestModel.find({})
  for (const accessRequest of accessRequests) {
    accessRequest.commentIds = []
    if (accessRequest.get('comments') !== undefined) {
      for (const accessCommment of accessRequest.get('comments')) {
        const username = !accessCommment.user.includes(':')
          ? toEntity('user', accessCommment.user)
          : accessCommment.user
        const newComment = new ResponseModel({
          user: username,
          kind: ResponseKind.Comment,
          comment: accessCommment.message,
          parentId: accessCommment._id,
          createdAt: accessCommment.createdAt,
          updatedAt: accessCommment.createdAt,
        })
        await newComment.save()
        accessRequest.commentIds.push(newComment._id)
        //accessRequest.set('comments', undefined, { strict: false })
      }
    }
    await accessRequest.save()
  }

  // Resolve review comments
  const reviews: any = await ReviewModel.find({})
  for (const review of reviews) {
    review.responseIds = []
    if (review.get('responses') !== undefined) {
      for (const reviewResponse of review.get('responses')) {
        const username = !reviewResponse.user.includes(':')
          ? toEntity('user', reviewResponse.user)
          : reviewResponse.user
        const newComment = new ResponseModel({
          user: username,
          kind: ResponseKind.Review,
          comment: reviewResponse.comment,
          role: review.role,
          decision: reviewResponse.decision,
          parentId: review._id,
          createdAt: reviewResponse.createdAt,
          updatedAt: reviewResponse.createdAt,
        })
        await newComment.save()
        review.responseIds.push(newComment._id)
        //delete review.comments
      }
    }
    await review.save()
  }
}

export async function down() {
  /* NOOP */
}
