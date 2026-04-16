// import AccessRequestModel from '../../models/AccessRequest.js'
// import ModelModel from '../../models/Model.js'
// import ReleaseModel from '../../models/Release.js'
// import ReviewRoleModel from '../../models/ReviewRole.js'
// import SchemaModel from '../../models/Schema.js'
// import { UserInterface } from '../../models/User.js'
// import {
//   BaseMetrics,
//   GetOverviewMetricsResponse,
//   SchemaInfo,
//   StateInfo,
// } from '../../routes/v2/metrics/getOverviewMetrics.js'
// import { GetPolicyMetricsResponse } from '../../routes/v2/metrics/getPolicyMetrics.js'
// import { searchModels } from '../../services/model.js'
// import { searchSchemas } from '../../services/schema.js'
// import { SchemaKind } from '../../types/enums.js'
// import { BaseMetricsConnector } from './base.js'

// type ModelFilter = {
//   organisation?: string
// }

// async function calculateTotalUsers(): Promise<number> {
//   const result = await ModelModel.aggregate([
//     { $unwind: '$collaborators' },
//     { $group: { _id: '$collaborators.entity' } },
//     { $count: 'count' },
//   ])

//   return result[0]?.count ?? 0
// }

// async function calculateTotalModels(modelFilter: ModelFilter): Promise<number> {
//   return ModelModel.countDocuments(modelFilter)
// }

// /**
//  * Returns the number of distinct models that have at least one release.
//  * If `org` is provided, limits the count to models in that organisation.
//  */
// async function calculateModelsWithReleases(modelFilter: ModelFilter): Promise<number> {
//   const isFiltered = !!modelFilter.organisation

//   if (!isFiltered) {
//     const result = await ReleaseModel.aggregate([{ $group: { _id: '$modelId' } }, { $count: 'count' }])
//     return result[0]?.count ?? 0
//   }

//   const modelIds = await ModelModel.distinct('id', {
//     organisation: modelFilter.organisation,
//   })

//   if (modelIds.length === 0) {
//     return 0
//   }

//   const result = await ReleaseModel.aggregate([
//     { $match: { modelId: { $in: modelIds } } },
//     { $group: { _id: '$modelId' } },
//     { $count: 'count' },
//   ])

//   return result[0]?.count ?? 0
// }

// /**
//  * Returns the number of distinct models that have at least one access request.
//  * If filtering by organisation, only models in that organisation are counted.
//  */
// async function calculateModelsWithAccessRequests(modelFilter: ModelFilter): Promise<number> {
//   const isFiltered = !!modelFilter.organisation

//   if (!isFiltered) {
//     const result = await AccessRequestModel.aggregate([{ $group: { _id: '$modelId' } }, { $count: 'count' }])

//     return result[0]?.count ?? 0
//   }

//   const modelIds = await ModelModel.distinct('id', {
//     organisation: modelFilter.organisation,
//   })

//   if (modelIds.length === 0) {
//     return 0
//   }

//   const result = await AccessRequestModel.aggregate([
//     { $match: { modelId: { $in: modelIds } } },
//     { $group: { _id: '$modelId' } },
//     { $count: 'count' },
//   ])

//   return result[0]?.count ?? 0
// }

// async function calculateSchemaBreakdown(user: UserInterface, org?: string): Promise<SchemaInfo[]> {
//   const schemas = await searchSchemas(SchemaKind.Model, false)

//   const schemaCounts: SchemaInfo[] = []

//   for (const schema of schemas) {
//     let modelsWithSchema
//     if (org) {
//       modelsWithSchema = await searchModels(user, {
//         schemaId: schema.id,
//         organisations: [org],
//       })
//     } else {
//       modelsWithSchema = await searchModels(user, {
//         schemaId: schema.id,
//       })
//     }

//     schemaCounts.push({
//       schemaId: schema.id,
//       schemaName: schema.name,
//       count: modelsWithSchema.models.length,
//     })
//   }

//   return schemaCounts
// }

// async function calculateModelsByState(modelFilter: ModelFilter): Promise<StateInfo[]> {
//   const modelsByState = await ModelModel.aggregate([
//     { $match: modelFilter },
//     { $group: { _id: '$state', count: { $sum: 1 } } },
//     { $sort: { count: -1 } },
//   ])

//   return modelsByState.map((row) => ({
//     state: row._id && row._id.trim() !== '' ? row._id : 'none',
//     count: row.count,
//   }))
// }

// async function calculateOverviewMetricsForOrg(user: UserInterface, org?: string): Promise<BaseMetrics> {
//   let totalUsers = -1
//   let modelFilter = {}
//   if (org) {
//     modelFilter = { organisation: org }
//   } else {
//     totalUsers = await calculateTotalUsers()
//   }

//   const totalModels = await calculateTotalModels(modelFilter)
//   const stateMetrics = await calculateModelsByState(modelFilter)
//   const schemaMetrics = await calculateSchemaBreakdown(user, org)
//   const totalModelsWithReleases = await calculateModelsWithReleases(modelFilter)
//   const totalModelsWithAccessRequests = await calculateModelsWithAccessRequests(modelFilter)

//   return {
//     users: totalUsers,
//     models: totalModels,
//     schemaBreakdown: schemaMetrics,
//     modelState: stateMetrics,
//     withReleases: totalModelsWithReleases,
//     withAccessRequest: totalModelsWithAccessRequests,
//   }
// }

// type SchemaRoleMap = {
//   schemaRoleMap: Record<string, string[]>
//   defaultRoles: string[]
// }

// async function buildSchemaRoleMap(): Promise<SchemaRoleMap> {
//   // 1. Get all active schemas
//   const schemas = await SchemaModel.find({
//     active: true,
//     hidden: false,
//   })
//     .select('id reviewRoles')
//     .lean()

//   // 2. Get all non-deleted review roles
//   const reviewRoles = await ReviewRoleModel.find({
//     deleted: { $ne: true }, // from softDelete plugin
//   })
//     .select('shortName systemRole')
//     .lean()

//   // 3. Determine default (system) roles
//   const defaultRoles = reviewRoles.filter((role) => !!role.systemRole).map((role) => role.shortName)

//   // 4. Build schemaId -> roles map
//   const schemaRoleMap: Record<string, string[]> = {}

//   for (const schema of schemas) {
//     schemaRoleMap[schema.id] = schema.reviewRoles ?? []
//   }

//   return {
//     schemaRoleMap,
//     defaultRoles,
//   }
// }

// type PolicyMetricsResult = {
//   summary: { role: string; count: number }[]
//   models: {
//     modelId: string
//     missingRoles: string[]
//   }[]
// }

// async function calculateMissingModelRolesForOrg(
//   schemaRoleMap: Record<string, string[]>,
//   defaultRoles: string[],
//   org?: string,
// ): Promise<PolicyMetricsResult> {
//   const filter: any = {
//     deleted: { $ne: true },
//   }

//   if (org) {
//     filter.organisation = org
//   }

//   const models = await ModelModel.find(filter).select('id organisation card collaborators').lean()

//   const modelsResult: PolicyMetricsResult['models'] = []

//   // Build set of all known roles
//   const allKnownRoles = new Set<string>(defaultRoles)

//   Object.values(schemaRoleMap).forEach((roles) => {
//     roles.forEach((role) => allKnownRoles.add(role))
//   })

//   // Initialise counters to 0
//   const roleMissingCount: Record<string, number> = {}

//   for (const role of allKnownRoles) {
//     roleMissingCount[role] = 0
//   }

//   // Evaluate each model
//   for (const model of models) {
//     // Determine applicable roles
//     let applicableRoles = [...defaultRoles]

//     const schemaId = model.card?.schemaId
//     if (schemaId && schemaRoleMap[schemaId]) {
//       applicableRoles = [...defaultRoles, ...schemaRoleMap[schemaId]]
//     }

//     const applicableSet = new Set(applicableRoles)

//     // Collect active roles
//     const activeRoleSet = new Set<string>()

//     for (const collaborator of model.collaborators ?? []) {
//       for (const role of collaborator.roles ?? []) {
//         if (role && role.trim() !== '') {
//           activeRoleSet.add(role)
//         }
//       }
//     }

//     // Determine missing roles
//     const missingRoles: string[] = []

//     for (const role of applicableSet) {
//       if (!activeRoleSet.has(role)) {
//         missingRoles.push(role)
//         roleMissingCount[role] += 1
//       }
//     }

//     if (missingRoles.length > 0) {
//       modelsResult.push({
//         modelId: model.id,
//         missingRoles,
//       })
//     }
//   }

//   // Convert summary to expected format
//   const summary = Object.keys(roleMissingCount)
//     .sort()
//     .map((role) => ({
//       role,
//       count: roleMissingCount[role],
//     }))

//   return {
//     summary,
//     models: modelsResult,
//   }
// }

// async function getOrganisationIds(): Promise<string[]> {
//   return await ModelModel.distinct('organisation')
// }

// export class SimpleMetricsConnector extends BaseMetricsConnector {
//   async calculateOverviewMetrics(user: UserInterface): Promise<GetOverviewMetricsResponse> {
//     // Get distinct organisations
//     const organisationIds = await getOrganisationIds()

//     // Calculate global metrics
//     const global = await calculateOverviewMetricsForOrg(user)

//     // Calculate per-org metrics
//     const byOrganisation = await Promise.all(
//       organisationIds.map(async (org) => ({
//         organisation: org,
//         ...(await calculateOverviewMetricsForOrg(user, org)),
//       })),
//     )

//     return {
//       global,
//       byOrganisation,
//     }
//   }

//   async calculatePolicyMetrics(): Promise<GetPolicyMetricsResponse> {
//     const { schemaRoleMap, defaultRoles } = await buildSchemaRoleMap()

//     const global = await calculateMissingModelRolesForOrg(schemaRoleMap, defaultRoles)

//     const organisationIds = await getOrganisationIds()

//     const byOrganisation = await Promise.all(
//       organisationIds.map(async (org) => ({
//         organisation: org,
//         ...(await calculateMissingModelRolesForOrg(schemaRoleMap, defaultRoles, org)),
//       })),
//     )

//     return {
//       global,
//       byOrganisation,
//     }
//   }
// }
