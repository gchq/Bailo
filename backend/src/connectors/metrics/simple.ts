import { Model, PipelineStage } from 'mongoose'
import NodeCache from 'node-cache'

import AccessRequestModel from '../../models/AccessRequest.js'
import ModelModel from '../../models/Model.js'
import ReleaseModel from '../../models/Release.js'
import ReviewRoleModel from '../../models/ReviewRole.js'
import SchemaModel from '../../models/Schema.js'
import {
  BaseMetrics,
  GetOverviewMetricsResponse,
  SchemaInfo,
  StateInfo,
} from '../../routes/v2/metrics/getOverviewMetrics.js'
import { GetPolicyMetricsResponse } from '../../routes/v2/metrics/getPolicyMetrics.js'
import { searchSchemas } from '../../services/schema.js'
import { SchemaKind } from '../../types/enums.js'
import { BadReq } from '../../utils/error.js'
import { BaseMetricsConnector, ModelVolumeDataPoint, ModelVolumePeriod } from './base.js'

const SCHEMA_ROLE_CACHE_TTL = 5 * 60 // 5 minutes
const SCHEMA_ROLE_CACHE_KEY = 'schemaRoleMap'

const schemaRoleCache = new NodeCache({
  stdTTL: SCHEMA_ROLE_CACHE_TTL,
  checkperiod: SCHEMA_ROLE_CACHE_TTL,
  useClones: false,
})

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
        from: 'v2_models',
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
async function countDistinctModelsWithRelation(collection: Model<any>, filter: ModelFilter): Promise<number> {
  // Faster approach for no organisation filter
  if (!filter.organisation) {
    // may need to change this field depending on the collection type
    const ids = await collection.distinct('modelId')
    return ids.length
  }
  // Organisation requires joining models
  const pipeline: PipelineStage[] = [
    ...buildOrganisationLookupStages(filter.organisation),
    { $group: { _id: '$modelId' } },
    { $count: 'count' },
  ]
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

  const totalUsersPromise = org ? Promise.resolve<number | undefined>(undefined) : calculateTotalUsers()

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

type SchemaRoleMap = {
  schemaRoleMap: Record<string, string[]>
  defaultRoles: string[]
  roleMeta: Record<string, { roleId: string; roleName: string }>
}

/**
 * Builds a lookup structure describing which review roles apply to which schemas.
 */
async function buildSchemaRoleMapInternal(): Promise<SchemaRoleMap> {
  const schemas = await SchemaModel.find({
    active: true,
    hidden: false,
  })
    .select('id reviewRoles')
    .lean()

  // Fetch review roles (soft-deleted records automatically excluded)
  // const reviewRoles = await ReviewRoleModel.find().select('shortName systemRole').lean()
  const reviewRoles = await ReviewRoleModel.find().select('shortName name systemRole').lean()

  // Extract system roles (apply to all models)
  const defaultRoles = reviewRoles.filter((role) => !!role.systemRole).map((role) => role.shortName)

  // Build schemaId -> roles mapping
  const schemaRoleMap: Record<string, string[]> = {}

  for (const schema of schemas) {
    schemaRoleMap[schema.id] = schema.reviewRoles ?? []
  }

  const roleMeta: Record<string, { roleId: string; roleName: string }> = {}

  for (const role of reviewRoles) {
    roleMeta[role.shortName] = {
      roleId: role.shortName,
      roleName: role.name,
    }
  }

  return {
    schemaRoleMap,
    defaultRoles,
    roleMeta,
  }
}

export async function buildSchemaRoleMap(): Promise<SchemaRoleMap> {
  const cached = schemaRoleCache.get<SchemaRoleMap>(SCHEMA_ROLE_CACHE_KEY)
  if (cached !== undefined) {
    return cached
  }

  const value = await buildSchemaRoleMapInternal()
  schemaRoleCache.set(SCHEMA_ROLE_CACHE_KEY, value)

  return value
}

type PolicyMetricsResult = {
  summary: {
    roleId: string
    roleName: string
    count: number
  }[]
  models: {
    modelId: string
    missingRoles: {
      roleId: string
      roleName: string
    }[]
  }[]
}

/**
 * Calculates which models are missing required review roles, either globally
 * or scoped to a specific organisation.
 */
async function calculateMissingModelRolesForOrg(
  schemaRoleMap: Record<string, string[]>,
  defaultRoles: string[],
  roleMeta: Record<string, { roleId: string; roleName: string }>,
  org?: string,
): Promise<PolicyMetricsResult> {
  const filter: any = {
    deleted: { $ne: true },
  }

  if (org) {
    filter.organisation = org
  }

  const models = await ModelModel.find(filter).select('id organisation card collaborators').lean()

  const modelsResult: PolicyMetricsResult['models'] = []

  // Build set of all known roles
  const allKnownRoles = new Set<string>(defaultRoles)

  Object.values(schemaRoleMap).forEach((roles) => {
    roles.forEach((role) => allKnownRoles.add(role))
  })

  // Initialise counters to 0
  const roleMissingCount: Record<string, number> = {}

  for (const role of allKnownRoles) {
    roleMissingCount[role] = 0
  }

  // Evaluate each model
  for (const model of models) {
    // Determine applicable roles
    let applicableRoles = [...defaultRoles]

    const schemaId = model.card?.schemaId
    if (schemaId && schemaRoleMap[schemaId]) {
      applicableRoles = [...defaultRoles, ...schemaRoleMap[schemaId]]
    }

    const applicableSet = new Set(applicableRoles)

    // Collect active roles
    const activeRoleSet = new Set<string>()

    for (const collaborator of model.collaborators ?? []) {
      for (const role of collaborator.roles ?? []) {
        if (role && role.trim() !== '') {
          activeRoleSet.add(role)
        }
      }
    }

    // Determine missing roles
    const missingRoles: {
      roleId: string
      roleName: string
    }[] = []

    for (const roleId of applicableSet) {
      if (!activeRoleSet.has(roleId)) {
        roleMissingCount[roleId] += 1

        missingRoles.push({
          roleId,
          roleName: roleMeta[roleId]?.roleName ?? roleId,
        })
      }
    }

    if (missingRoles.length > 0) {
      modelsResult.push({
        modelId: model.id,
        missingRoles,
      })
    }
  }

  // Convert summary to expected format
  const summary = Object.keys(roleMissingCount)
    .sort()
    .map((roleId) => ({
      roleId,
      roleName: roleMeta[roleId]?.roleName ?? roleId,
      count: roleMissingCount[roleId],
    }))

  return {
    summary,
    models: modelsResult,
  }
}

/**
 * Retrieves the list of distinct organisation identifiers
 * for which models currently exist.
 */
async function getOrganisationIds(): Promise<string[]> {
  return await ModelModel.distinct('organisation')
}

export class SimpleMetricsConnector extends BaseMetricsConnector {
  async calculateOverviewMetrics(): Promise<GetOverviewMetricsResponse> {
    const organisationIds = await getOrganisationIds()

    const globalPromise = calculateOverviewMetricsForOrg()

    const byOrganisationPromise = Promise.all(
      organisationIds.map(async (org) => ({
        organisation: org || 'unset',
        ...(await calculateOverviewMetricsForOrg(org)),
      })),
    )

    const [global, byOrganisation] = await Promise.all([globalPromise, byOrganisationPromise])

    return {
      global,
      byOrganisation,
    }
  }
  async calculatePolicyMetrics(): Promise<GetPolicyMetricsResponse> {
    const { schemaRoleMap, defaultRoles, roleMeta } = await buildSchemaRoleMap()

    const global = await calculateMissingModelRolesForOrg(schemaRoleMap, defaultRoles, roleMeta)

    const organisationIds = await getOrganisationIds()

    const byOrganisation = await Promise.all(
      organisationIds.map(async (org) => ({
        organisation: org || 'unset',
        ...(await calculateMissingModelRolesForOrg(schemaRoleMap, defaultRoles, roleMeta, org)),
      })),
    )

    return {
      global,
      byOrganisation,
    }
  }

  async calculateModelVolume(
    period: ModelVolumePeriod,
    startDate: string | number | Date = 0,
    endDate?: string | number | Date,
    timezone?: string,
    organisation?: string,
  ): Promise<{ startDate: string; endDate: string; dataPoints: ModelVolumeDataPoint[] }> {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()

    const match: Record<string, unknown> = {
      createdAt: { $gte: start, $lte: end },
    }

    if (organisation) {
      match.organisation = organisation
    }

    const pipeline: PipelineStage[] = [
      { $match: match },

      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$createdAt',
              unit: period,
              ...(timezone && { timezone }),
            },
          },
          count: { $sum: 1 },
        },
      },

      { $sort: { _id: 1 } },

      {
        $project: {
          _id: 0,
          periodStart: '$_id',
          periodEnd: {
            $dateAdd: {
              startDate: '$_id',
              unit: period,
              amount: 1,
              ...(timezone && { timezone }),
            },
          },
          count: 1,
        },
      },
    ]

    try {
      const dataPoints = await ModelModel.aggregate<{
        periodStart: Date
        periodEnd: Date
        count: number
      }>(pipeline)

      const formattedDataPoints = dataPoints.map((dataPoint) => ({
        periodStart: dataPoint.periodStart.toISOString(),
        periodEnd: dataPoint.periodEnd.toISOString(),
        count: dataPoint.count,
      }))

      return { startDate: start.toISOString(), endDate: end.toISOString(), dataPoints: formattedDataPoints }
    } catch (err: any) {
      if (err?.message?.includes('timezone') || err?.message?.includes('Time zone')) {
        throw BadReq('Invalid timezone. Must be a valid IANA timezone or UTC offset.')
      }

      throw err
    }
  }
}
