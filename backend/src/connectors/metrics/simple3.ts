import { PipelineStage } from 'mongoose'

import AccessRequestModel from '../../models/AccessRequest.js'
import ModelModel from '../../models/Model.js'
import ReleaseModel from '../../models/Release.js'
import {
  BaseMetrics,
  GetOverviewMetricsResponse,
  SchemaInfo,
  StateInfo,
} from '../../routes/v2/metrics/getOverviewMetrics.js'
import { searchSchemas } from '../../services/schema.js'
import { SchemaKind } from '../../types/enums.js'
import { BaseMetricsConnector } from './base.js'

type ModelFilter = {
  organisation?: string
}

function buildModelMatchStage(filter: ModelFilter): PipelineStage.Match {
  const match: Record<string, unknown> = {}

  if (filter.organisation) {
    match.organisation = filter.organisation
  }

  return { $match: match }
}

/**
 * Creates aggregation stages to join a related collection with the models
 * collection and filter by organisation.
 *
 * Used when counting models referenced by other collections (e.g. releases
 * or access requests).
 */
function buildOrganisationLookupStages(org: string): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'models',
        localField: 'modelId',
        foreignField: 'id',
        as: 'model',
      },
    },
    { $unwind: '$model' },
    { $match: { 'model.organisation': org } },
  ]
}

/**
 * Counts the number of unique collaborator entities across all models.
 */
async function calculateTotalUsers(): Promise<number> {
  const pipeline: PipelineStage[] = [
    { $unwind: '$collaborators' },
    { $group: { _id: '$collaborators.entity' } },
    { $count: 'count' },
  ]

  const result = await ModelModel.aggregate(pipeline)

  return result[0]?.count ?? 0
}

/**
 * Counts the total number of models matching the provided filter.
 */
async function calculateTotalModels(filter: ModelFilter): Promise<number> {
  return ModelModel.countDocuments(filter)
}

/**
 * Counts distinct models referenced in another collection
 * (e.g. releases or access requests).
 *
 * If an organisation filter is provided, a lookup is performed to ensure
 * only models belonging to that organisation are counted.
 */
async function countDistinctModelsWithRelation(collection: any, filter: ModelFilter): Promise<number> {
  const pipeline: PipelineStage[] = []

  if (filter.organisation) {
    pipeline.push(...buildOrganisationLookupStages(filter.organisation))
  }

  pipeline.push({ $group: { _id: '$modelId' } }, { $count: 'count' })

  const result = await collection.aggregate(pipeline)

  return result[0]?.count ?? 0
}

/**
 * Returns the number of models grouped by lifecycle state.
 */
async function calculateModelsByState(filter: ModelFilter): Promise<StateInfo[]> {
  const pipeline: PipelineStage[] = [
    buildModelMatchStage(filter),
    { $group: { _id: '$state', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]

  const modelsByState = await ModelModel.aggregate(pipeline)

  return modelsByState.map((row) => ({
    state: row._id && row._id.trim() !== '' ? row._id : 'none',
    count: row.count,
  }))
}

/**
 * Calculates how many models use each schema.
 */
async function calculateSchemaBreakdown(filter: ModelFilter): Promise<SchemaInfo[]> {
  const schemas = await searchSchemas(SchemaKind.Model, false)

  const pipeline: PipelineStage[] = [buildModelMatchStage(filter), { $group: { _id: '$schemaId', count: { $sum: 1 } } }]

  const modelCounts = await ModelModel.aggregate(pipeline)

  const countMap = new Map<string, number>(modelCounts.map((r: any) => [r._id, r.count]))

  return schemas.map((schema) => ({
    schemaId: schema.id,
    schemaName: schema.name,
    count: countMap.get(schema.id) ?? 0,
  }))
}

/**
 * Calculates the full set of overview metrics either globally
 * or scoped to a specific organisation.
 */
async function calculateOverviewMetricsForOrg(org?: string): Promise<BaseMetrics> {
  const modelFilter: ModelFilter = org ? { organisation: org } : {}

  const totalUsersPromise = org ? Promise.resolve(-1) : calculateTotalUsers()

  const [totalUsers, totalModels, stateMetrics, schemaMetrics, totalModelsWithReleases, totalModelsWithAccessRequests] =
    await Promise.all([
      totalUsersPromise,
      calculateTotalModels(modelFilter),
      calculateModelsByState(modelFilter),
      calculateSchemaBreakdown(modelFilter),
      countDistinctModelsWithRelation(ReleaseModel, modelFilter),
      countDistinctModelsWithRelation(AccessRequestModel, modelFilter),
    ])

  return {
    users: totalUsers,
    models: totalModels,
    schemaBreakdown: schemaMetrics,
    modelState: stateMetrics,
    withReleases: totalModelsWithReleases,
    withAccessRequest: totalModelsWithAccessRequests,
  }
}

export class SimpleMetricsConnector extends BaseMetricsConnector {
  async calculateOverviewMetrics(): Promise<GetOverviewMetricsResponse> {
    const organisationIds: string[] = await ModelModel.distinct('organisation')

    const globalPromise = calculateOverviewMetricsForOrg()

    const byOrganisationPromise = Promise.all(
      organisationIds.map(async (org) => ({
        organisation: org,
        ...(await calculateOverviewMetricsForOrg(org)),
      })),
    )

    const [global, byOrganisation] = await Promise.all([globalPromise, byOrganisationPromise])

    return {
      global,
      byOrganisation,
    }
  }
}
