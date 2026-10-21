import { escapeRegExp } from 'lodash-es'
import { type PipelineStage, QueryFilter } from 'mongoose'

import DeploymentAssessmentModel, { DeploymentAssessmentInterface } from '../models/DeploymentAssessment.js'
import ResponseModel, {
  DecisionKeys,
  ResponseKind,
  type ResponseKindKeys,
  type ResponseReaction,
} from '../models/Response.js'
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

type LookupPipelineStage = Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>

function getResponseMatchStage(parentId: string, kind: ResponseKindKeys): PipelineStage.Match {
  return {
    $match: {
      $expr: {
        $and: [{ $eq: ['$parentId', parentId] }, { $eq: ['$kind', kind] }],
      },
    },
  }
}

function getResponseLookup(
  letVariables: Record<string, string>,
  parentId: string,
  kind: ResponseKindKeys,
  pipeline: LookupPipelineStage[],
  as: string,
): PipelineStage.Lookup {
  return {
    $lookup: {
      from: ResponseModel.collection.name,
      let: letVariables,
      pipeline: [getResponseMatchStage(parentId, kind), ...pipeline],
      as,
    },
  }
}

function getResponseHistoryProjection(includeDecision: boolean): PipelineStage.Project {
  return {
    $project: {
      _id: 0,
      id: { $toString: '$_id' },
      entity: 1,
      ...(includeDecision && { decision: 1 }),
      comment: 1,
      reactions: { $ifNull: ['$reactions', []] },
      commentEditedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  }
}

function getDeploymentAssessmentCommentLookup(): PipelineStage.Lookup {
  return getResponseLookup(
    { deploymentAssessmentObjectId: '$_id' },
    '$$deploymentAssessmentObjectId',
    ResponseKind.Comment,
    [{ $sort: { createdAt: 1 } }, getResponseHistoryProjection(false)],
    'comments',
  )
}

function getLatestReviewResponseLookup(as: string): PipelineStage.Lookup {
  return getResponseLookup(
    { reviewId: '$_id' },
    '$$reviewId',
    ResponseKind.Review,
    [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
    as,
  )
}

function getReviewResponseHistoryLookup(): PipelineStage.Lookup {
  return getResponseLookup(
    { reviewId: '$_id' },
    '$$reviewId',
    ResponseKind.Review,
    [{ $sort: { createdAt: 1 } }, getResponseHistoryProjection(true)],
    'reviewResponses',
  )
}

function getDeploymentAssessmentReviewMatchStages(): LookupPipelineStage[] {
  return [
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
  ]
}

function getReviewHistoryStages(): LookupPipelineStage[] {
  return [
    getReviewResponseHistoryLookup(),
    {
      $unwind: '$reviewResponses',
    },
    {
      $sort: { 'reviewResponses.createdAt': -1 },
    },
    {
      $group: {
        _id: {
          reviewId: '$_id',
          entity: '$reviewResponses.entity',
        },
        reviewResponses: { $push: '$reviewResponses' },
      },
    },
    {
      $unwind: {
        path: '$reviewResponses',
        includeArrayIndex: 'responseIndex',
      },
    },
    {
      $set: {
        'reviewResponses.outdated': { $gt: ['$responseIndex', 0] },
      },
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
  ]
}

function getLatestReviewStatusByRoleStages(): LookupPipelineStage[] {
  return [
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: '$role',
        review: { $first: '$$ROOT' },
      },
    },
    {
      $replaceRoot: { newRoot: '$review' },
    },
    getLatestReviewResponseLookup('latestResponse'),
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
  ]
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
    getLatestReviewResponseLookup('latestResponse'),
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
  id: string
  entity: string
  comment?: string
  reactions: ResponseReaction[]
  commentEditedAt?: string
  createdAt: string
  updatedAt: string
}

export interface DeploymentAssessmentCommentsRecord {
  id: string
  name: string
  comments: DeploymentAssessmentCommentRecord[]
}

export interface DeploymentAssessmentReviewRecord {
  id: string
  entity: string
  decision?: DecisionKeys
  comment?: string
  reactions: ResponseReaction[]
  commentEditedAt?: string
  createdAt: string
  updatedAt: string
  outdated: boolean
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
    getDeploymentAssessmentCommentLookup(),
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
        from: ReviewModel.collection.name,
        let: { deploymentAssessmentId: '$id' },
        pipeline: [...getDeploymentAssessmentReviewMatchStages(), ...getReviewHistoryStages()],
        as: 'reviewRecords',
      },
    },
    {
      $lookup: {
        from: ReviewModel.collection.name,
        let: { deploymentAssessmentId: '$id' },
        pipeline: [...getDeploymentAssessmentReviewMatchStages(), ...getLatestReviewStatusByRoleStages()],
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
