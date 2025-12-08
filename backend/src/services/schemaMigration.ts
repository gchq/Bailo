import { ModelAction, SchemaMigrationAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import ModelModel, { ModelDoc } from '../models/Model.js'
import ModelCardRevisionModel from '../models/ModelCardRevision.js'
import SchemaMigration, { SchemaMigrationInterface } from '../models/SchemaMigration.js'
import SchemaMigrationModel from '../models/SchemaMigration.js'
import { UserInterface } from '../models/User.js'
import { SchemaMigrationKind } from '../types/enums.js'
import { BadReq, Forbidden, NotFound } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { handleDuplicateKeys } from '../utils/mongo.js'
import { getPropValue } from '../utils/object.js'

export async function createSchemaMigrationPlan(
  user: UserInterface,
  schemaMigration: Partial<SchemaMigrationInterface>,
) {
  if (!schemaMigration.name) {
    throw BadReq('Could not create an ID for the schema migration due to missing name property')
  }
  const migrationId = convertStringToId(schemaMigration.name)
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

export type UpdateSchemaMigrationPlan = Pick<
  SchemaMigrationInterface,
  'name' | 'description' | 'questionMigrations' | 'draft'
>

export async function updateSchemaMigrationPlan(
  user: UserInterface,
  schemaMigrationId: string,
  planDiff: UpdateSchemaMigrationPlan,
) {
  const schemaMigrationPlan = await SchemaMigrationModel.findOne({ id: schemaMigrationId })
  if (!schemaMigrationPlan) {
    throw NotFound('Cannot find specified schema migration plan.', { schemaMigrationId })
  }
  const auth = await authorisation.schemaMigration(user, schemaMigrationPlan, SchemaMigrationAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      schemaMigrationName: schemaMigrationPlan.name,
    })
  }
  Object.assign(schemaMigrationPlan, planDiff)
  await schemaMigrationPlan.save()

  return schemaMigrationPlan
}

export async function searchSchemaMigrationById(schemaMigrationId: string) {
  const schemaMigrationPlan = await SchemaMigration.findOne({ id: schemaMigrationId })
  if (!schemaMigrationPlan) {
    throw NotFound('Cannot find specified schema migration plan.', { schemaMigrationId })
  }
  return schemaMigrationPlan
}

export async function searchSchemaMigrations(sourceSchema?: string) {
  return await SchemaMigration.find({ ...(sourceSchema && { sourceSchema }) })
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

  const migrationPlan = await SchemaMigrationModel.findOne({ id: migrationPlanId })
  if (!migrationPlan) {
    throw BadReq('Cannot find specified schema migration plan.', { migrationPlanId })
  }

  if (model.card.schemaId !== migrationPlan.sourceSchema) {
    throw BadReq(`The schema for this model does not match the migration plan's source schema.`)
  }

  try {
    const updatedModel = await runMigrationPlan(modelDoc, migrationPlan)
    updatedModel.set('card.schemaId', migrationPlan.targetSchema)
    updatedModel.set('card.version', updatedModel.card ? updatedModel.card.version + 1 : 1)
    await updatedModel.save()
    const newDocument = {
      schemaId: migrationPlan.targetSchema,
      version: updatedModel.card ? updatedModel.card.version : 1,
      metadata: updatedModel.card?.metadata ? updatedModel.card?.metadata : {},
    }
    const revision = new ModelCardRevisionModel({ ...newDocument, modelId, createdBy: user.dn })
    await revision.save()
    return modelDoc
  } catch (error) {
    throw BadReq('There was an error performing the migration', { error })
  }
}

async function runMigrationPlan(model: ModelDoc, migrationPlan: SchemaMigrationInterface) {
  for (const migrationQuestion of migrationPlan.questionMigrations) {
    switch (migrationQuestion.kind) {
      case SchemaMigrationKind.Delete:
        model.set(`card.metadata.${migrationQuestion.sourcePath}`, undefined, { strict: false })
        break
      case SchemaMigrationKind.Move:
        if (getPropValue(model, `card.metadata.${migrationQuestion.sourcePath}`)) {
          model.set(
            `card.metadata.${migrationQuestion.targetPath}`,
            getPropValue(model, `card.metadata.${migrationQuestion.sourcePath}`),
          )
        }
        model.set(`card.metadata.${migrationQuestion.sourcePath}`, undefined, { strict: false })
        break
    }
  }
  return model
}
