import { ModelAction, SchemaMigrationAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import ModelModel, { ModelDoc } from '../models/Model.js'
import SchemaMigration, { SchemaMigrationInterface } from '../models/SchemaMigration.js'
import SchemaMigrationModel from '../models/SchemaMigration.js'
import { UserInterface } from '../models/User.js'
import { SchemaMigrationKind } from '../types/enums.js'
import { BadReq, Forbidden } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { handleDuplicateKeys } from '../utils/mongo.js'

export async function createSchemaMigrationPlan(
  user: UserInterface,
  schemaMigration: Partial<SchemaMigrationInterface>,
) {
  const migrationId = convertStringToId(schemaMigration.name || '')
  const schemaMigrationDoc = new SchemaMigration({ id: migrationId, ...schemaMigration })

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
  return await SchemaMigrationModel.findOne({ id: id })
}

export async function searchSchemaMigrations(id?: string, sourceSchema?: string) {
  return await SchemaMigration.find({ ...(id && { id }), ...(sourceSchema && { sourceSchema }) })
}

export async function runModelSchemaMigration(user: UserInterface, modelId: string, migrationPlanId: string) {
  const modelDoc = await ModelModel.findOne({ id: modelId })

  if (!modelDoc) {
    throw BadReq('Model cannot be found', { modelId })
  }

  const model = modelDoc.toObject()

  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  if (!model.card) {
    throw BadReq('Model cannot be migrated as it does not have a valid model card.', { modelId })
  }

  const migrationPlan = await getSchemaMigrationById(migrationPlanId)
  if (!migrationPlan) {
    throw BadReq('Cannot find specified schema migration plan.', { migrationPlanId })
  }

  if (model.card.schemaId !== migrationPlan.sourceSchema) {
    throw BadReq(`The schema for this model does not match the migration plan's source schema.`)
  }

  try {
    await runMigrationPlan(modelDoc, migrationPlan)
  } catch (error) {
    throw BadReq('There was an error performing the migration', { error })
  }

  modelDoc.set('card.schemaId', migrationPlan.targetSchema)
  await modelDoc.save()
  return modelDoc
}

function getPropValue(sourceObject: any, dotNotationPath: string) {
  let returnData = sourceObject

  dotNotationPath.split('.').forEach((subPath) => {
    returnData = returnData[subPath] || ''
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
        if (getPropValue(model, `card.metadata.${migrationQuestion.sourcePath}`) !== '') {
          model.set(
            `card.metadata.${migrationQuestion.targetPath}`,
            getPropValue(model, `card.metadata.${migrationQuestion.sourcePath}`),
          )
        }
        model.set(`card.metadata.${migrationQuestion.sourcePath}`, undefined, { strict: false })
        break
    }
    await model.save()
  }
}
