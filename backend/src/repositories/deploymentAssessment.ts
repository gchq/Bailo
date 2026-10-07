import { escapeRegExp } from 'lodash-es'
import { QueryFilter } from 'mongoose'

import DeploymentAssessmentModel, { DeploymentAssessmentInterface } from '../models/DeploymentAssessment.js'
import { DecisionKeys, ResponseKind } from '../models/Response.js'
import ReviewModel from '../models/Review.js'
import { ReviewKind } from '../types/enums.js'

export interface SearchDeploymentAssessmentsParams {
  schemaId?: string
  modelIds?: string[]
  riskOwner?: string
  createdBy?: string
  createdAfter?: string
  createdBefore?: string
  draft?: boolean
  search?: string
  state?: string
  needsAction?: boolean
}

export async function findDeploymentAssessments(
  params: SearchDeploymentAssessmentsParams,
): Promise<DeploymentAssessmentInterface[]> {
  const query: QueryFilter<DeploymentAssessmentInterface> = {}

  if (params.schemaId) {
    query.schemaId = params.schemaId
  }

  if (params.modelIds?.length) {
    query['metadata.modelOverview.modelIds'] = { $all: params.modelIds }
  }

  if (params.riskOwner) {
    query['metadata.signOff.riskOwners'] = { $in: [params.riskOwner] }
  }

  if (params.createdBy) {
    query.createdBy = params.createdBy
  }

  if (params.createdAfter || params.createdBefore) {
    const beforeDate = params.createdBefore ? new Date(params.createdBefore) : undefined
    beforeDate?.setUTCDate(beforeDate.getUTCDate() + 1)

    query.createdAt = {
      ...(params.createdAfter && {
        $gte: new Date(params.createdAfter),
      }),
      ...(beforeDate && {
        $lt: beforeDate,
      }),
    }
  }

  if (params.draft !== undefined) {
    query.draft = params.draft
  }

  if (params.search) {
    query.name = {
      $regex: escapeRegExp(params.search),
      $options: 'i',
    }
  }

  const docs = await DeploymentAssessmentModel.find(query).sort({
    draft: -1,
    updatedAt: -1,
  })
  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    schemaId: doc.schemaId,
    metadata: doc.metadata,
    draft: doc.draft,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }))
}

export async function findLatestDecisionsByAssessmentIds(
  assessmentIds: string[],
): Promise<Map<string, DecisionKeys | undefined>> {
  if (assessmentIds.length === 0) {
    return new Map()
  }

  const latestDecisions = await ReviewModel.aggregate<{
    _id: string
    decision?: DecisionKeys
  }>([
    {
      $match: {
        deploymentAssessmentId: { $in: assessmentIds },
        kind: ReviewKind.DeploymentAssessment,
      },
    },
    {
      $lookup: {
        from: 'v2_responses',
        let: { reviewId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$parentId', '$$reviewId'] },
              kind: ResponseKind.Review,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 1,
          },
        ],
        as: 'latestResponse',
      },
    },
    {
      $unwind: {
        path: '$latestResponse',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $sort: {
        'latestResponse.createdAt': -1,
      },
    },
    {
      $group: {
        _id: '$deploymentAssessmentId',
        decision: { $first: '$latestResponse.decision' },
      },
    },
  ])

  return new Map(latestDecisions.map(({ _id, decision }) => [_id, decision]))
}

export interface DeploymentAssessmentCommentRecord {
  entity: string
  comment?: string
  createdAt: string
}

export interface DeploymentAssessmentCommentsRecord {
  id: string
  name: string
  comments: DeploymentAssessmentCommentRecord[]
}

export interface DeploymentAssessmentReviewRecord {
  entity: string
  decision?: DecisionKeys
  comment?: string
  createdAt: string
}

export interface DeploymentAssessmentReviewStatusRecord {
  role: string
  status: DecisionKeys
}

export interface DeploymentAssessmentReviewsRecord {
  id: string
  name: string
  statuses: DeploymentAssessmentReviewStatusRecord[]
  reviews: DeploymentAssessmentReviewRecord[]
}

export async function findDeploymentAssessmentComments(
  deploymentAssessmentId: string,
): Promise<DeploymentAssessmentCommentsRecord | undefined> {
  const [deploymentAssessment] = await DeploymentAssessmentModel.aggregate<DeploymentAssessmentCommentsRecord>([
    {
      $match: {
        id: deploymentAssessmentId,
      },
    },
    {
      $lookup: {
        from: 'v2_responses',
        let: { deploymentAssessmentObjectId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$parentId', '$$deploymentAssessmentObjectId'] },
                  { $eq: ['$kind', ResponseKind.Comment] },
                ],
              },
            },
          },
          {
            $sort: { createdAt: 1 },
          },
          {
            $project: {
              _id: 0,
              entity: 1,
              comment: 1,
              createdAt: 1,
            },
          },
        ],
        as: 'comments',
      },
    },
    {
      $project: {
        _id: 0,
        id: 1,
        name: 1,
        comments: 1,
      },
    },
  ])

  return deploymentAssessment
}

export async function findDeploymentAssessmentReviews(
  deploymentAssessmentId: string,
): Promise<DeploymentAssessmentReviewsRecord | undefined> {
  const [deploymentAssessment] = await DeploymentAssessmentModel.aggregate<DeploymentAssessmentReviewsRecord>([
    {
      $match: {
        id: deploymentAssessmentId,
      },
    },
    {
      $lookup: {
        from: 'v2_reviews',
        let: { deploymentAssessmentId: '$id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$deploymentAssessmentId', '$$deploymentAssessmentId'] },
                  { $eq: ['$kind', ReviewKind.DeploymentAssessment] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: 'v2_responses',
              let: { reviewId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$parentId', '$$reviewId'] }, { $eq: ['$kind', ResponseKind.Review] }],
                    },
                  },
                },
                {
                  $sort: { createdAt: 1 },
                },
                {
                  $project: {
                    _id: 0,
                    entity: 1,
                    decision: 1,
                    comment: 1,
                    createdAt: 1,
                  },
                },
              ],
              as: 'reviewResponses',
            },
          },
          {
            $unwind: '$reviewResponses',
          },
          {
            $sort: { 'reviewResponses.createdAt': 1 },
          },
          {
            $group: {
              _id: null,
              reviews: { $push: '$reviewResponses' },
            },
          },
        ],
        as: 'reviewRecords',
      },
    },
    {
      $lookup: {
        from: 'v2_reviews',
        let: { deploymentAssessmentId: '$id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$deploymentAssessmentId', '$$deploymentAssessmentId'] },
                  { $eq: ['$kind', ReviewKind.DeploymentAssessment] },
                ],
              },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 1,
          },
          {
            $lookup: {
              from: 'v2_responses',
              let: { reviewId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$parentId', '$$reviewId'] }, { $eq: ['$kind', ResponseKind.Review] }],
                    },
                  },
                },
                {
                  $sort: { createdAt: -1 },
                },
                {
                  $limit: 1,
                },
              ],
              as: 'latestResponse',
            },
          },
          {
            $unwind: '$latestResponse',
          },
          {
            $project: {
              _id: 0,
              role: 1,
              status: '$latestResponse.decision',
            },
          },
        ],
        as: 'statuses',
      },
    },
    {
      $set: {
        reviews: {
          $ifNull: [{ $arrayElemAt: ['$reviewRecords.reviews', 0] }, []],
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: 1,
        name: 1,
        statuses: 1,
        reviews: 1,
      },
    },
  ])

  return deploymentAssessment
}
