import { ModelAction, SchemaMigrationAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import ModelModel, { ModelDoc } from '../models/Model.js'
import SchemaMigration, { SchemaMigrationInterface, SchemaMigrationKind } from '../models/SchemaMigration.js'
import SchemaMigrationModel from '../models/SchemaMigration.js'
import { UserInterface } from '../models/User.js'
import { BadReq, Forbidden } from '../utils/error.js'
import { handleDuplicateKeys } from '../utils/mongo.js'

export async function createSchemaMigrationPlan(
  user: UserInterface,
  schemaMigration: Partial<SchemaMigrationInterface>,
) {
  const schemaMigrationDoc = new SchemaMigration(schemaMigration)

  const auth = await authorisation.schemaMigration(user, schemaMigrationDoc, SchemaMigrationAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      schemaMigrationName: schemaMigrationDoc.name,
    })
  }

  try {
    return await schemaMigrationDoc.save()
  } catch (error) {
    handleDuplicateKeys(error)
    throw error
  }
}

export async function getSchemaMigrationById(id: string) {
  return await SchemaMigrationModel.findOne({ _id: id })
}

export async function searchSchemaMigrations(name?: string) {
  return await SchemaMigration.find({ ...(name && { name }) })
}

export async function runModelSchemaMigration(user: UserInterface, modelId: string, migrationPlanId: string) {
  const modelDoc = await ModelModel.findOne({ id: modelId })

  if (!modelDoc) {
    return BadReq('Model cannot be found', { modelId })
  }

  const model = modelDoc.toObject()

  const recheckAuth = await authorisation.model(user, model, ModelAction.Update)
  if (!recheckAuth.success) {
    throw Forbidden(recheckAuth.info, { userDn: user.dn })
  }

  if (!model.card) {
    return BadReq('Model cannot be migrated as it does not have a valid model card.', { modelId })
  }

  const migrationPlan = await getSchemaMigrationById(migrationPlanId)
  if (!migrationPlan) {
    return BadReq('Cannot find specified schema migration plan.', { migrationPlanId })
  }

  try {
    await runMigrationPlan(modelDoc, migrationPlan)
  } catch (error) {
    throw BadReq('There was an error performing the migration', { error })
  }

  modelDoc.set('card.schemaId', migrationPlan.targetSchema)
  await modelDoc.save()
}

function getPropValue(sourceObject: any, dotNotationPath: string) {
  let returnData = sourceObject

  dotNotationPath.split('.').forEach((subPath) => {
    returnData = returnData[subPath] || `Property ${subPath} not found`
  })

  return returnData
}

async function runMigrationPlan(model: ModelDoc, migrationPlan: SchemaMigrationInterface) {
  for (const migrationQuestion of migrationPlan.questionMigrations) {
    switch (migrationQuestion.kind) {
      case SchemaMigrationKind.Delete:
        model.set(`card.metadata.${migrationQuestion.sourcePath}`, undefined, { strict: false })
        break
      case SchemaMigrationKind.Move:
        model.set(
          `card.metadata.${migrationQuestion.targetPath}`,
          getPropValue(model, `card.metadata.${migrationQuestion.sourcePath}`),
        )
        model.set(`card.metadata.${migrationQuestion.sourcePath}`, undefined, { strict: false })
        break
    }
    await model.save()
  }
}
