import { Model, PipelineStage } from 'mongoose'
import NodeCache from 'node-cache'

import AccessRequestModel from '../../models/AccessRequest.js'
import ModelModel from '../../models/Model.js'
import ReleaseModel from '../../models/Release.js'
import ReviewRoleModel from '../../models/ReviewRole.js'
import SchemaModel from '../../models/Schema.js'
import { GetComplianceMetricsResponse } from '../../routes/v3/metrics/getComplianceMetrics.js'
import {
  GetModelVolumeResponse,
  ModelVolumeDataPoint,
  ModelVolumeInterval,
} from '../../routes/v3/metrics/getModelVolume.js'
import { BaseMetrics, GetUsageMetricsResponse, SchemaInfo, StateInfo } from '../../routes/v3/metrics/getUsageMetrics.js'
import { SchemaKind } from '../../types/enums.js'
import { BadReq } from '../../utils/error.js'
import { isMongoServerError } from '../../utils/mongo.js'
import { addInterval, buildModelMatchStage, ModelFilter, SchemaRoleMap } from './metricUtils.js'

const METRICS_CACHE_TTL = 5 * 60 // 5 minutes
const USAGE_METRICS_CACHE_KEY = 'usageMetrics'
const COMPLIANCE_METRICS_CACHE_KEY = 'complianceMetrics'

const metricsCache = new NodeCache({
  stdTTL: METRICS_CACHE_TTL,
  checkperiod: METRICS_CACHE_TTL,
  useClones: false,
})

function getCached<T>(key: string): T | undefined {
  return metricsCache.get<T>(key)
}

function setCached<T>(key: string, value: T): void {
  metricsCache.set(key, value)
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
  if (filter.organisation === undefined) {
    const ids = await collection.distinct('modelId')
    return ids.length
  }

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
  const pipeline: PipelineStage[] = [
    {
      $match: {
        kind: SchemaKind.Model,
        hidden: false,
      },
    },
    // Lookup models that reference this schema
    {
      $lookup: {
        from: 'models',
        let: { schemaId: '$_id' },
        pipeline: [
          {
            // Match models whose card.schemaId equals this schema's _id
            $match: {
              $expr: { $eq: ['$card.schemaId', '$$schemaId'] },
              ...(filter.organisation !== undefined && {
                organisation: filter.organisation,
              }),
            },
          },
          {
            $count: 'count',
          },
        ],
        as: 'modelUsage',
      },
    },
    // Extract the count value from the lookup result.
    {
      $addFields: {
        count: {
          $ifNull: [{ $arrayElemAt: ['$modelUsage.count', 0] }, 0],
        },
      },
    },
    {
      $project: {
        schemaId: '$_id',
        schemaName: '$name',
        count: 1,
        _id: 0,
      },
    },
  ]

  return SchemaModel.aggregate<SchemaInfo>(pipeline)
}

/**
 * Calculates the full set of usage metrics either globally
 * or scoped to a specific organisation.
 */
async function calculateUsageMetrics(filter: ModelFilter): Promise<BaseMetrics> {
  const [totalModels, stateMetrics, schemaMetrics, totalModelsWithReleases, totalModelsWithAccessRequests] =
    await Promise.all([
      calculateTotalModels(filter),
      calculateModelsByState(filter),
      calculateSchemaBreakdown(filter),
      countDistinctModelsWithRelation(ReleaseModel, filter),
      countDistinctModelsWithRelation(AccessRequestModel, filter),
    ])

  return {
    users: undefined,
    models: totalModels,
    schemaBreakdown: schemaMetrics,
    modelState: stateMetrics,
    withReleases: totalModelsWithReleases,
    withAccessRequest: totalModelsWithAccessRequests,
  }
}

/**
 * Builds a lookup structure describing which review roles apply to which schemas.
 */
export async function buildSchemaRoleMap(): Promise<SchemaRoleMap> {
  const schemas = await SchemaModel.find({
    active: true,
    hidden: false,
  })
    .select('id reviewRoles')
    .lean()

  // Fetch review roles
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

type ComplianceMetricsResult = {
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
 * Streams models for role evaluation using a mongoose cursor
 * to avoid loading the entire result set into memory.
 */
function streamModelsForRoleEvaluation(filter: Record<string, any>) {
  return ModelModel.find(filter).select('id organisation card collaborators').lean().cursor()
}

/**
 * Calculates which models are missing required review roles, either globally
 * or scoped to a specific organisation.
 */
async function calculateMissingModelRoles(
  schemaRoleMap: Record<string, string[]>,
  defaultRoles: string[],
  roleMeta: Record<string, { roleId: string; roleName: string }>,
  org?: string,
): Promise<ComplianceMetricsResult> {
  const filter: ModelFilter = {}

  // Only undefined means global
  if (org !== undefined) {
    filter.organisation = org
  }

  const models = streamModelsForRoleEvaluation(filter)

  const modelsResult: ComplianceMetricsResult['models'] = []

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
  for await (const model of models) {
    let applicableRoles = [...defaultRoles]

    const schemaId = model.card?.schemaId
    if (schemaId && schemaRoleMap[schemaId]) {
      applicableRoles = [...defaultRoles, ...schemaRoleMap[schemaId]]
    }

    const applicableSet = new Set(applicableRoles)

    const activeRoleSet = new Set<string>()

    for (const collaborator of model.collaborators ?? []) {
      for (const role of collaborator.roles ?? []) {
        if (role && role.trim() !== '') {
          activeRoleSet.add(role)
        }
      }
    }

    const missingRoles: { roleId: string; roleName: string }[] = []

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
 * Builds a cache key for model volume metrics based on
 * interval, date range, and timezone to ensure parameter-safe caching.
 */
function buildModelVolumeCacheKey(interval: ModelVolumeInterval, start: Date, end: Date, timezone?: string): string {
  return ['modelVolume', interval, start.toISOString(), end.toISOString(), timezone ?? 'none'].join(':')
}

export class BaseMetricsConnector {
  organisations: string[]

  constructor(organisations: string[]) {
    this.organisations = organisations
  }

  /**
   * Retrieves the list of distinct organisation identifiers
   * for which models currently exist.
   */
  async getOrganisationIds(): Promise<string[]> {
    return [...this.organisations, '']
  }

  /**
   * Gets metrics around general model usage within Bailo.
   */
  async getUsageMetrics(): Promise<GetUsageMetricsResponse> {
    const cached = getCached<GetUsageMetricsResponse>(USAGE_METRICS_CACHE_KEY)
    if (cached !== undefined) {
      return cached
    }

    const organisationIds = await this.getOrganisationIds()

    const byOrganisation = await Promise.all(
      organisationIds.map(async (orgRaw) => {
        const organisation = orgRaw && orgRaw.trim() !== '' ? orgRaw : 'unset'

        const filter: ModelFilter = orgRaw === '' ? { organisation: '' } : { organisation: orgRaw }

        const metrics = await calculateUsageMetrics(filter)

        return { organisation, ...metrics }
      }),
    )

    const schemaCounts = new Map<string, SchemaInfo>()
    const stateCounts = new Map<string, StateInfo>()

    let models = 0
    let withReleases = 0
    let withAccessRequest = 0

    // Tally up the metrics for each org to get global metrics
    for (const org of byOrganisation) {
      models += org.models
      withReleases += org.withReleases
      withAccessRequest += org.withAccessRequest

      for (const schema of org.schemaBreakdown ?? []) {
        const key = String(schema.schemaId)
        const existing = schemaCounts.get(key)

        if (existing) {
          existing.count += schema.count
        } else {
          schemaCounts.set(key, { ...schema, schemaId: key })
        }
      }

      for (const state of org.modelState ?? []) {
        const existing = stateCounts.get(state.state)

        if (existing) {
          existing.count += state.count
        } else {
          stateCounts.set(state.state, { ...state })
        }
      }
    }

    const global: BaseMetrics = {
      users: await calculateTotalUsers(),
      models,
      withReleases,
      withAccessRequest,
      schemaBreakdown: Array.from(schemaCounts.values()),
      modelState: Array.from(stateCounts.values()).sort((a, b) => b.count - a.count),
    }

    const result = { global, byOrganisation }

    setCached(USAGE_METRICS_CACHE_KEY, result)

    return result
  }

  /**
   * Gets metrics around system compliance and roles.
   */
  async getComplianceMetrics(): Promise<GetComplianceMetricsResponse> {
    const cached = getCached<GetComplianceMetricsResponse>(COMPLIANCE_METRICS_CACHE_KEY)
    if (cached !== undefined) {
      return cached
    }

    const { schemaRoleMap, defaultRoles, roleMeta } = await buildSchemaRoleMap()

    const global = await calculateMissingModelRoles(schemaRoleMap, defaultRoles, roleMeta)

    const organisationIds = await this.getOrganisationIds()

    const byOrganisation = await Promise.all(
      organisationIds.map(async (org) => ({
        organisation: org || 'unset',
        ...(await calculateMissingModelRoles(schemaRoleMap, defaultRoles, roleMeta, org)),
      })),
    )

    const result = { global, byOrganisation }

    setCached(COMPLIANCE_METRICS_CACHE_KEY, result)

    return result
  }

  /**
   * Calculates metrics about model usage over time.
   */
  async calculateModelVolume(
    interval: ModelVolumeInterval,
    startDate: string | Date,
    endDate: string | Date,
    timezone?: string,
  ): Promise<GetModelVolumeResponse> {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const cacheKey = buildModelVolumeCacheKey(interval, start, end, timezone)

    const cached = getCached<GetModelVolumeResponse>(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    try {
      const alignedResult = await ModelModel.aggregate<{ alignedStart: Date }>([
        {
          $project: {
            alignedStart: {
              $dateTrunc: {
                date: start,
                unit: interval,
                ...(interval === 'week' ? { startOfWeek: 'sunday' } : {}),
                ...(timezone && { timezone }),
              },
            },
          },
        },
        { $limit: 1 },
      ])

      const alignedStart = alignedResult[0]?.alignedStart ?? new Date(start)

      // Aggregate counts per time interval and organisation
      const endExclusive = addInterval(end, 'day')
      const pipeline: PipelineStage[] = [
        {
          $match: {
            createdAt: { $gte: start, $lt: endExclusive },
          },
        },
        {
          $group: {
            _id: {
              periodStart: {
                $dateTrunc: {
                  date: '$createdAt',
                  unit: interval,
                  ...(interval === 'week' ? { startOfWeek: 'sunday' } : {}),
                  ...(timezone && { timezone }),
                },
              },
              organisation: {
                $cond: {
                  if: { $or: [{ $eq: ['$organisation', null] }, { $eq: ['$organisation', ''] }] },
                  then: 'unset',
                  else: '$organisation',
                },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.periodStart': 1 } },
      ]

      const results = await ModelModel.aggregate<{
        _id: { periodStart: Date; organisation: string }
        count: number
      }>(pipeline)

      // Convert aggregation results into a lookup map
      const intervalMap = new Map<string, Record<string, number>>()

      for (const row of results) {
        const key = row._id.periodStart.toISOString()

        if (!intervalMap.has(key)) {
          intervalMap.set(key, {})
        }

        intervalMap.get(key)![row._id.organisation] = row.count
      }

      // Derive full organisation list from database
      const distinctOrgs = await ModelModel.distinct('organisation')
      const allOrgs = distinctOrgs.filter((org) => org && org.trim() !== '')

      // Always include "unset"
      if (!allOrgs.includes('unset')) {
        allOrgs.push('unset')
      }

      const intervals: ModelVolumeDataPoint[] = []

      let cursor = new Date(alignedStart)

      // Generate intervals from start to end date, filling gaps with zero counts
      while (cursor < endExclusive) {
        const intervalStart = new Date(cursor)
        const intervalEnd = addInterval(intervalStart, interval)

        const key = intervalStart.toISOString()
        const orgCounts = intervalMap.get(key) ?? {}

        const organisationsObject: Record<string, number> = {}
        let total = 0

        for (const org of allOrgs) {
          const count = orgCounts[org] ?? 0
          organisationsObject[org] = count
          total += count
        }

        intervals.push({
          startDate: intervalStart.toISOString(),
          endDate: intervalEnd.toISOString(),
          count: total,
          organisations: organisationsObject,
        })

        cursor = addInterval(cursor, interval)
      }

      const result: GetModelVolumeResponse = {
        interval,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        data: intervals,
      }

      setCached(cacheKey, result)

      return result
    } catch (err: unknown) {
      if (isMongoServerError(err)) {
        const message = err.message ?? ''

        if (message.includes('timezone') || message.includes('Time zone')) {
          throw BadReq('Invalid timezone. Must be a valid IANA timezone or UTC offset.')
        }
      }

      throw err
    }
  }
}
