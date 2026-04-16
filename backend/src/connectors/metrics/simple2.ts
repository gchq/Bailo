import { PipelineStage } from 'mongoose'

import AccessRequestModel from '../../models/AccessRequest.js'
import ModelModel from '../../models/Model.js'
import ReleaseModel from '../../models/Release.js'
import { UserInterface } from '../../models/User.js'
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

function buildModelMatch(filter: ModelFilter) {
  const match: Record<string, unknown> = {}
  if (filter.organisation) {
    match.organisation = filter.organisation
  }
  return match
}

async function calculateTotalUsers(): Promise<number> {
  const result = await ModelModel.aggregate([
    { $unwind: '$collaborators' },
    { $group: { _id: '$collaborators.entity' } },
    { $count: 'count' },
  ])

  return result[0]?.count ?? 0
}

async function calculateTotalModels(filter: ModelFilter): Promise<number> {
  return ModelModel.countDocuments(filter)
}

async function countDistinctModelsWithRelation(collection: any, filter: ModelFilter): Promise<number> {
  const matchStages: PipelineStage[] = []

  if (filter.organisation) {
    matchStages.push(
      {
        $lookup: {
          from: 'models',
          localField: 'modelId',
          foreignField: 'id',
          as: 'model',
        },
      },
      { $unwind: '$model' },
      { $match: { 'model.organisation': filter.organisation } },
    )
  }

  const result = await collection.aggregate([...matchStages, { $group: { _id: '$modelId' } }, { $count: 'count' }])

  return result[0]?.count ?? 0
}

async function calculateModelsByState(filter: ModelFilter): Promise<StateInfo[]> {
  const modelsByState = await ModelModel.aggregate([
    { $match: buildModelMatch(filter) },
    { $group: { _id: '$state', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])

  return modelsByState.map((row) => ({
    state: row._id && row._id.trim() !== '' ? row._id : 'none',
    count: row.count,
  }))
}

async function calculateSchemaBreakdown(filter: ModelFilter): Promise<SchemaInfo[]> {
  const schemas = await searchSchemas(SchemaKind.Model, false)

  const modelCounts = await ModelModel.aggregate([
    { $match: buildModelMatch(filter) },
    { $group: { _id: '$schemaId', count: { $sum: 1 } } },
  ])

  const countMap = new Map<string, number>(modelCounts.map((r: any) => [r._id, r.count]))

  return schemas.map((schema) => ({
    schemaId: schema.id,
    schemaName: schema.name,
    count: countMap.get(schema.id) ?? 0,
  }))
}

async function calculateOverviewMetricsForOrg(user: UserInterface, org?: string): Promise<BaseMetrics> {
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
  async calculateOverviewMetrics(user: UserInterface): Promise<GetOverviewMetricsResponse> {
    const organisationIds: string[] = await ModelModel.distinct('organisation')

    const globalPromise = calculateOverviewMetricsForOrg(user)

    const byOrganisationPromise = Promise.all(
      organisationIds.map(async (org) => ({
        organisation: org,
        ...(await calculateOverviewMetricsForOrg(user, org)),
      })),
    )

    const [global, byOrganisation] = await Promise.all([globalPromise, byOrganisationPromise])

    return {
      global,
      byOrganisation,
    }
  }
}
