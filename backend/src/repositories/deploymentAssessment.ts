import { escapeRegExp } from 'lodash-es'
import { QueryFilter } from 'mongoose'

import DeploymentAssessmentModel, { DeploymentAssessmentInterface } from '../models/DeploymentAssessment.js'

export interface SearchDeploymentAssessmentsParams {
  schemaId?: string
  modelIds?: string[]
  riskOwner?: string
  createdBy?: string
  createdAfter?: string
  createdBefore?: string
  draft?: boolean
  search?: string
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
