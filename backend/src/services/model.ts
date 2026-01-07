import { Validator } from 'jsonschema'
import * as _ from 'lodash-es'
import { Optional } from 'utility-types'

import { Roles } from '../connectors/authentication/Base.js'
import authentication from '../connectors/authentication/index.js'
import { ModelAction, ModelActionKeys, ReleaseAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import peers from '../connectors/peer/index.js'
import ModelModel, { CollaboratorEntry, EntryKindKeys, ModelDoc, ModelInterface } from '../models/Model.js'
import ModelCardRevisionModel, { ModelCardRevisionDoc } from '../models/ModelCardRevision.js'
import ReviewModel from '../models/Review.js'
import ReviewRoleModel from '../models/ReviewRole.js'
import { UserInterface } from '../models/User.js'
import { GetModelCardVersionOptions, GetModelCardVersionOptionsKeys } from '../types/enums.js'
import { isBailoError } from '../types/error.js'
import {
  EntityKind,
  EntrySearchOptionsParams,
  EntrySearchResultWithErrors,
  EntryUserPermissions,
  MirrorImportLogData,
} from '../types/types.js'
import { isValidatorResultError } from '../types/ValidatorResultError.js'
import { fromEntity, toEntity } from '../utils/entity.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { authResponseToUserPermission } from '../utils/permissions.js'
import { useTransaction } from '../utils/transactions.js'
import { getAccessRequestsByModel, removeAccessRequests } from './accessRequest.js'
import { getFilesByModel, removeFiles } from './file.js'
import { getInferencesByModel, removeInferences } from './inference.js'
import { listModelImages, softDeleteImage } from './registry.js'
import { deleteReleases, getModelReleases } from './release.js'
import { findReviews } from './review.js'
import { getSchemaById } from './schema.js'
import { dropModelIdFromTokens, getTokensForModel } from './token.js'
import { getWebhooksByModel } from './webhook.js'

export function checkModelRestriction(model: ModelInterface) {
  if (model.settings.mirror.sourceModelId) {
    throw BadReq(`Cannot alter a mirrored model.`)
  }
}

type OptionalCreateModelParams = Optional<Pick<ModelInterface, 'tags'>, 'tags'>

export type CreateModelParams = Pick<
  ModelInterface,
  'name' | 'description' | 'visibility' | 'settings' | 'kind' | 'collaborators'
> &
  OptionalCreateModelParams
export async function createModel(user: UserInterface, modelParams: CreateModelParams) {
  const modelId = convertStringToId(modelParams.name)

  if (modelParams.collaborators) {
    await validateCollaborators(modelParams.collaborators)
  }

  if (modelParams.tags) {
    const tagSet = new Set(modelParams.tags.map((tag) => tag.trim().toLowerCase()))
    if (tagSet.size !== modelParams.tags.length) {
      throw BadReq('You cannot have duplicate tags')
    }
  }

  let collaborators: CollaboratorEntry[] = []
  if (modelParams.collaborators && modelParams.collaborators.length > 0) {
    const collaboratorListContainsOwner = modelParams.collaborators.some((collaborator) =>
      collaborator.roles.some((role) => role === 'owner'),
    )
    if (collaboratorListContainsOwner) {
      collaborators = modelParams.collaborators
    } else {
      throw BadReq('At least one collaborator must be given the owner role.')
    }
  } else {
    collaborators = [
      {
        entity: toEntity('user', user.dn),
        roles: ['owner'],
      },
    ]
  }

  const model = new ModelModel({
    ...modelParams,
    id: modelId,
    collaborators,
  })

  const auth = await authorisation.model(user, model, ModelAction.Create)

  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  if (modelParams?.settings?.mirror?.destinationModelId && modelParams?.settings?.mirror?.sourceModelId) {
    throw BadReq('You cannot select both mirror settings simultaneously.')
  }

  await model.save()

  return model
}

/**
 * Get a model by its ID without doing any auth checks.
 *
 * @remarks
 * _Only_ use this function when an auth check would break expected functionality, otherwise use `getModelById`.
 */
export async function getModelByIdNoAuth(modelId: string, kind?: EntryKindKeys): Promise<ModelDoc> {
  const model = await ModelModel.findOne({
    id: modelId,
    ...(kind && { kind }),
  })

  if (!model) {
    throw NotFound('The requested entry was not found.', { modelId })
  }

  return model
}

export async function getModelById(user: UserInterface, modelId: string, kind?: EntryKindKeys): Promise<ModelDoc> {
  const model = await getModelByIdNoAuth(modelId, kind)

  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  return model
}

export async function removeModel(user: UserInterface, modelId: string, kind?: EntryKindKeys) {
  const model = await ModelModel.findOne({
    id: modelId,
    ...(kind && { kind }),
  })

  if (!model) {
    throw NotFound('The requested entry was not found.', { modelId })
  }

  const auth = await authorisation.model(user, model, ModelAction.Delete)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  const [
    allModelReviews,
    allModelImages,
    allModelReleases,
    allModelTokens,
    allModelWebhooks,
    allModelCardRevisions,
    allModelFiles,
    allModelInferences,
    allModelAccessRequests,
  ] = await Promise.all([
    findReviews(user, false, undefined, modelId),
    listModelImages(user, modelId),
    getModelReleases(user, modelId),
    getTokensForModel(user, modelId),
    getWebhooksByModel(user, modelId),
    getModelCardRevisions(user, modelId),
    getFilesByModel(user, modelId),
    getInferencesByModel(user, modelId),
    getAccessRequestsByModel(user, modelId),
  ])

  return await useTransaction([
    // Initial concurrency has no overlapping Documents.
    (session) =>
      Promise.all([
        // ModelCardRevision
        Promise.all(allModelCardRevisions.map((modelCardRevision) => modelCardRevision.delete(session))),
        // Review
        Promise.all(allModelReviews.map((review) => ReviewModel.findByIdAndDelete(review._id, session))),
        // Token
        dropModelIdFromTokens(user, modelId, allModelTokens, session),
        // Webhook
        Promise.all(allModelWebhooks.map((webhook) => webhook.delete(session))),
        // Inference
        removeInferences(
          user,
          allModelInferences.flatMap((inference) => ({
            modelId: inference.modelId,
            image: inference.image,
            tag: inference.tag,
          })),
          session,
        ),
      ]),
    // Only delete Releases after deleting Reviews as deleteReleases modifies Release, Review and Response Documents.
    (session) =>
      deleteReleases(
        user,
        modelId,
        allModelReleases.flatMap((release) => release.semver),
        true,
        session,
      ),
    (session) =>
      Promise.all([
        // Only delete AccessRequests after deleting Releases as removeAccessRequests modifies AccessRequest, Review & Response Documents.
        // Reviews are already deleted but Responses are only partially deleted and may overlap so cannot be concurrent.
        removeAccessRequests(
          user,
          allModelAccessRequests.flatMap((accessRequest) => accessRequest.id),
          session,
        ),
        // Only delete Files after deleting Releases as removeFiles modifies File, Scan & Release Documents.
        removeFiles(
          user,
          modelId,
          allModelFiles.flatMap((file) => file.id),
          true,
          session,
        ),
        // Only delete Images after deleting Releases as softDeleteImage modifies Releases.
        Promise.all(
          allModelImages.flatMap((modelImage) =>
            modelImage.tags.map((tag) =>
              softDeleteImage(
                user,
                {
                  repository: modelImage.repository,
                  name: modelImage.name,
                  tag,
                },
                true,
                session,
              ),
            ),
          ),
        ),
      ]),
    // Finally, delete the Model
    (session) => model.delete(session),
  ])
}

export async function canUserActionModelById(user: UserInterface, modelId: string, action: ModelActionKeys) {
  // In most cases this function could be done in a single trip by the previous
  // query to the database.  An aggregate query with a 'lookup' can access this
  // data without having to wait.
  //
  // This function is made for simplicity, most functions that call this will
  // only be infrequently called.
  const model = await getModelById(user, modelId)

  const auth = await authorisation.model(user, model, action)
  return auth
}

export async function searchModels(
  user: UserInterface,
  opts: EntrySearchOptionsParams,
): Promise<EntrySearchResultWithErrors> {
  const results: EntrySearchResultWithErrors = {
    models: [],
  }

  const localModelsPromise = searchLocalModels(user, opts)

  localModelsPromise.catch((e) => {
    if (!results.errors) {
      results.errors = {}
    }
    if (isBailoError(e)) {
      results.errors['local'] = e
    } else {
      results.errors['local'] = InternalError('Search error', { err: e })
    }
  })

  const processLocalModels = localModelsPromise.then((localModels) => {
    results.models.push(
      ...localModels.map((model) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        tags: model.tags,
        kind: model.kind,
        organisation: model.organisation,
        state: model.state,
        collaborators: model.collaborators,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        sourceModelId: model.settings.mirror.sourceModelId,
        visibility: model.visibility,
      })),
    )
  })

  const promises: Promise<any>[] = [processLocalModels]

  if (opts.peers && opts.peers.length > 0) {
    const remotePromise = peers.searchEntries(user, opts)

    const processRemoteModels = remotePromise.then((remoteResponses) => {
      for (const response of remoteResponses.flat()) {
        if (response.models) {
          results.models.push(...response.models)
        }
        if (response.errors) {
          for (const [peerId, error] of Object.entries(response.errors)) {
            if (!results.errors) results.errors = {}
            results.errors[peerId] = error
            results.errors[peerId].message = error.message
          }
        }
      }
    })
    promises.push(processRemoteModels)
  }

  await Promise.all(promises)

  return results
}

async function searchLocalModels(user: UserInterface, opts: EntrySearchOptionsParams): Promise<Array<ModelInterface>> {
  const query: any = {}

  if (opts.adminAccess) {
    if (!(await authentication.hasRole(user, Roles.Admin))) {
      throw Forbidden('You do not have the required role.', {
        userDn: user.dn,
        requiredRole: Roles.Admin,
      })
    }
  }

  if (opts.kind) {
    query['kind'] = { $all: opts.kind }
  }

  if (opts.organisations?.length) {
    query.organisation = { $in: opts.organisations }
  }

  if (opts.states?.length) {
    query.state = { $in: opts.states }
  }

  if (opts.libraries?.length) {
    query.tags = { $all: opts.libraries }
  }

  if (opts.task) {
    if (query.tags) {
      query.tags.$all.push(opts.task)
    } else {
      query.tags = { $all: [opts.task] }
    }
  }

  if (opts.schemaId) {
    query['card.schemaId'] = { $all: opts.schemaId }
  }

  if (opts.allowTemplating) {
    query['settings.allowTemplating'] = true
  }

  if (opts.filters && opts.filters.length > 0) {
    if (opts.filters?.includes('mine')) {
      query.collaborators = {
        $elemMatch: {
          entity: { $in: await authentication.getEntities(user) },
        },
      }
    } else {
      query.collaborators = {
        $elemMatch: {
          roles: { $elemMatch: { $in: opts.filters } },
          entity: { $in: await authentication.getEntities(user) },
        },
      }
    }
  }

  const projection = {
    settings: false,
    card: false,
    deleted: false,
    _id: false,
    __v: false,
    deletedBy: false,
    deletedAt: false,
  }

  // Always do a partial match on the model name
  let results = await ModelModel.find(
    opts.search ? { ...query, name: { $regex: opts.search, $options: 'i' } } : query,
    projection,
  ).sort({
    updatedAt: -1,
  })

  //Include all full text matches
  if (opts.search && !opts.titleOnly) {
    let fullTextOnlyResults = await ModelModel.find({ ...query, $text: { $search: opts.search } }, projection).sort({
      score: { $meta: 'textScore' },
    })
    // Remove duplicate items
    const mask = new Set(results.map((model) => model.id))

    fullTextOnlyResults = fullTextOnlyResults.filter((model) => !mask.has(model.id))
    results = results.concat(fullTextOnlyResults)
  }

  //Auth already checked, so just need to check if they require admin access
  if (opts.adminAccess) {
    return results
  }
  const auths = await authorisation.models(user, results, ModelAction.View)
  return results.filter((_, i) => auths[i].success)
}

export async function getModelCard(
  user: UserInterface,
  modelId: string,
  version: number | GetModelCardVersionOptionsKeys,
  mirrored: boolean = false,
) {
  if (version === GetModelCardVersionOptions.Latest) {
    const card = (await getModelById(user, modelId)).card

    if (!card) {
      throw NotFound('This model has no model card setup', { modelId, version })
    }

    return card
  } else {
    return getModelCardRevision(user, modelId, version, mirrored)
  }
}

export async function getModelCardRevision(
  user: UserInterface,
  modelId: string,
  version: number,
  mirrored: boolean = false,
) {
  const modelCard = await ModelCardRevisionModel.findOne({ modelId, version, mirrored })
  const model = await getModelById(user, modelId)

  if (!modelCard) {
    throw NotFound(`Version '${version}' does not exist on the requested model`, { modelId, version })
  }

  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  return modelCard
}

export async function getModelCardRevisions(user: UserInterface, modelId: string) {
  const modelCardRevisions = await ModelCardRevisionModel.find({ modelId })

  if (!modelCardRevisions) {
    throw NotFound(`Version '${modelId}' does not exist on the requested model`, { modelId })
  }

  // We don't track the classification of individual model cards.  Instead, we should
  // ensure that the model is accessible to the user.
  const _model = await getModelById(user, modelId)

  return modelCardRevisions
}

// This is an internal function.  Use an equivalent like 'updateModelCard' or 'createModelCardFromSchema'
// if interacting with this from another service.
//
// This function would benefit from transactions, but we currently do not rely on the underlying
// database being a replica set.
export async function _setModelCard(
  user: UserInterface,
  modelId: string,
  schemaId: string,
  version: number,
  metadata: unknown,
) {
  // This function could cause a race case in the 'ModelCardRevision' model.  This
  // is prevented by ensuring there is a compound index on 'modelId' and 'version'.
  //
  // In the event that a race case occurs, the database will throw an error mentioning
  // that there is a duplicate item already found.  This prevents any requirement for
  // a lock on the collection that would likely be a significant slowdown to the query.
  //
  // It is assumed that this race case will occur infrequently.
  const model = await getModelById(user, modelId)

  const auth = await authorisation.model(user, model, ModelAction.Write)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  // We don't want to copy across other values

  const newDocument = {
    schemaId: schemaId,

    version,
    metadata,
    mirrored: false,
  }

  const revision = new ModelCardRevisionModel({ ...newDocument, modelId, createdBy: user.dn })

  const [savedRevision, _updatedModel] = await useTransaction([
    (session) => revision.save({ session }),
    (session) => ModelModel.updateOne({ id: modelId }, { $set: { card: newDocument } }, { session }),
  ])

  return savedRevision
}

export async function updateModelCard(
  user: UserInterface,
  modelId: string,
  metadata: unknown,
): Promise<ModelCardRevisionDoc> {
  const model = await getModelById(user, modelId)

  if (!model.card) {
    throw BadReq(`This model must first be instantiated before it can be `, { modelId })
  }

  const schema = await getSchemaById(model.card.schemaId)
  try {
    new Validator().validate(metadata, schema.jsonSchema, { throwAll: true, required: true })
  } catch (error) {
    if (isValidatorResultError(error)) {
      throw BadReq('Model metadata could not be validated against the schema.', {
        schemaId: model.card.schemaId,
        validationErrors: error.errors,
      })
    }
    throw error
  }

  const revision = await _setModelCard(user, modelId, model.card.schemaId, model.card.version + 1, metadata)
  return revision
}

export type UpdateModelParams = Pick<
  ModelInterface,
  'name' | 'description' | 'visibility' | 'collaborators' | 'state' | 'organisation' | 'tags'
> & {
  settings: Partial<ModelInterface['settings']>
}
export async function updateModel(user: UserInterface, modelId: string, modelDiff: Partial<UpdateModelParams>) {
  const model = await getModelById(user, modelId)
  if (modelDiff.settings?.mirror?.sourceModelId) {
    throw BadReq('Cannot change standard model to be a mirrored model.')
  }
  if (model.settings.mirror.sourceModelId && modelDiff.settings?.mirror?.destinationModelId) {
    throw BadReq('Cannot set a destination model ID for a mirrored model.')
  }
  if (modelDiff.settings?.mirror?.destinationModelId && modelDiff.settings?.mirror?.sourceModelId) {
    throw BadReq('You cannot select both mirror settings simultaneously.')
  }
  if (modelDiff.collaborators) {
    await validateCollaborators(modelDiff.collaborators, model.collaborators)
  }
  if (modelDiff.tags) {
    const tagSet = new Set(modelDiff.tags.map((tag) => tag.trim().toLowerCase()))
    if (tagSet.size !== modelDiff.tags.length) {
      throw BadReq('You cannot have duplicate tags')
    }
  }

  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  _.mergeWith(model, modelDiff, (a, b) => (_.isArray(b) ? b : undefined))

  // Re-check the authorisation after model has updated
  const recheckAuth = await authorisation.model(user, model, ModelAction.Update)
  if (!recheckAuth.success) {
    throw Forbidden(recheckAuth.info, { userDn: user.dn })
  }
  await model.save()

  return model
}

async function validateCollaborators(
  updatedCollaborators: CollaboratorEntry[],
  previousCollaborators: CollaboratorEntry[] = [],
) {
  const previousCollaboratorEntities: string[] = previousCollaborators.map((collaborator) => collaborator.entity)
  const duplicates = updatedCollaborators.reduce<string[]>(
    (duplicates, currentCollaborator, currentCollaboratorIndex) => {
      if (
        updatedCollaborators.find(
          (collaborator, index) =>
            index !== currentCollaboratorIndex && collaborator.entity === currentCollaborator.entity,
        ) &&
        !duplicates.includes(currentCollaborator.entity)
      ) {
        duplicates.push(currentCollaborator.entity)
      }
      return duplicates
    },
    [],
  )
  if (duplicates.length > 0) {
    throw BadReq(`The following duplicate collaborators have been found: ${duplicates.join(', ')}`)
  }
  const newCollaborators = updatedCollaborators.reduce<string[]>((acc, currentCollaborator) => {
    if (!previousCollaboratorEntities.includes(currentCollaborator.entity)) {
      acc.push(currentCollaborator.entity)
    }
    return acc
  }, [])
  await Promise.all(
    newCollaborators.map(async (collaborator) => {
      if (collaborator === '') {
        throw BadReq('Collaborator name must be a valid string')
      }
      // TODO we currently only check for users, we should consider how we want to handle groups
      const { kind } = fromEntity(collaborator)
      if (kind === EntityKind.USER) {
        await authentication.getUserInformation(collaborator)
      }
    }),
  )
}

export async function createModelCardFromSchema(
  user: UserInterface,
  modelId: string,
  schemaId: string,
): Promise<ModelCardRevisionDoc> {
  const model = await getModelById(user, modelId)
  checkModelRestriction(model)

  const auth = await authorisation.model(user, model, ModelAction.Write)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  if (model.card?.schemaId) {
    throw BadReq('This model already has a model card.', { modelId })
  }

  // Ensure schema exists
  const schema = await getSchemaById(schemaId)
  if (schema.hidden) {
    throw BadReq('Cannot create a new Card using a hidden schema.', { schemaId, kind: schema.kind })
  }

  // Check schema review roles for any default entities
  const reviewRolesForSchema = await ReviewRoleModel.find({ shortName: schema.reviewRoles })
  const updatedCollaborators: CollaboratorEntry[] = [...model.collaborators]
  for (const reviewRole of reviewRolesForSchema) {
    if (reviewRole.defaultEntities) {
      reviewRole.defaultEntities.forEach((defaultEntity) => {
        const existingDefault = updatedCollaborators.find(
          (existingCollaborator) => existingCollaborator.entity === defaultEntity,
        )
        return existingDefault
          ? existingDefault.roles.includes(reviewRole.shortName)
            ? null
            : existingDefault.roles.push(reviewRole.shortName)
          : updatedCollaborators.push({ entity: defaultEntity, roles: [reviewRole.shortName] })
      })
    }
  }
  model.collaborators = updatedCollaborators
  await model.save()

  const revision = await _setModelCard(user, modelId, schemaId, 1, {})
  return revision
}

export async function createModelCardFromTemplate(
  user: UserInterface,
  modelId: string,
  templateId: string,
): Promise<ModelCardRevisionDoc> {
  if (modelId === templateId) {
    throw BadReq('The model and template ID must be different', { modelId, templateId })
  }
  const model = await getModelById(user, modelId)
  if (model.card?.schemaId) {
    throw BadReq('This model already has a model card.', { modelId })
  }
  checkModelRestriction(model)
  const template = await getModelById(user, templateId)
  // Check to make sure user can access the template. We already check for the model auth later on in _setModelCard
  const templateAuth = await authorisation.model(user, template, ModelAction.View)
  if (!templateAuth.success) {
    throw Forbidden(templateAuth.info, { userDn: user.dn, templateId })
  }

  if (!template.card?.schemaId) {
    throw BadReq('The template model is missing a model card', { modelId, templateId })
  }
  const revision = await _setModelCard(user, modelId, template.card.schemaId, 1, template.card.metadata)
  return revision
}

export async function saveImportedModelCard(modelCardRevision: Omit<ModelCardRevisionDoc, '_id'>) {
  const schema = await getSchemaById(modelCardRevision.schemaId)
  try {
    new Validator().validate(modelCardRevision.metadata, schema.jsonSchema, { throwAll: true, required: true })
  } catch (error) {
    if (isValidatorResultError(error)) {
      throw BadReq('Model metadata could not be validated against the schema.', {
        schemaId: modelCardRevision.schemaId,
        validationErrors: error.errors,
      })
    }
    throw error
  }

  const foundModelCardRevision = await ModelCardRevisionModel.findOne({
    modelId: modelCardRevision.modelId,
    version: modelCardRevision.version,
  })

  if (!foundModelCardRevision && modelCardRevision.version !== 1) {
    // This model card did not already exist in Mongo, so it is a new model card. Return it to be audited.
    // Ignore model cards with a version number of 1 as these will always be blank.
    const newModelCardRevision = new ModelCardRevisionModel({ ...modelCardRevision, mirrored: true })
    await newModelCardRevision.save()
    return modelCardRevision
  }
}

/**
 * Note that we do not authorise that the user can access the model here.
 * This function should only be used during the import model card process.
 * Do not expose this functionality to users.
 */
export async function setLatestImportedModelCard(modelId: string) {
  const latestModelCard = await ModelCardRevisionModel.findOne({ modelId, mirrored: true }, undefined, {
    sort: { version: -1 },
  })

  if (!latestModelCard) {
    throw NotFound('Cannot find latest model card.', { modelId })
  }

  let latestNonMirroredCard = await ModelCardRevisionModel.findOne({ modelId, mirrored: false }, undefined, {
    sort: { version: -1 },
  })

  if (!latestNonMirroredCard) {
    latestNonMirroredCard = latestModelCard
  }

  const updatedModel = await ModelModel.findOne({
    id: modelId,
    'settings.mirror.sourceModelId': { $exists: true, $ne: '' },
  })

  if (!updatedModel) {
    throw InternalError('Unable to set latest model card of mirrored model.', {
      modelId,
      version: latestModelCard.version,
    })
  }

  updatedModel.mirroredCard = { ...latestModelCard }
  if (updatedModel.card === undefined || updatedModel.card.metadata === undefined) {
    const newCard = new ModelCardRevisionModel({
      modelId: updatedModel.id,
      schemaId: latestModelCard.schemaId,
      version: 1,
      mirrored: false,
      metadata: {},
      createdBy: latestModelCard.createdBy,
    })
    newCard.save()
    updatedModel.card = newCard
  }
  await updatedModel.save()
  return updatedModel
}

export async function validateMirroredModel(
  mirroredModelId: string,
  sourceModelId: string,
  logData: MirrorImportLogData,
) {
  const model = await ModelModel.findOne({
    id: mirroredModelId,
    'settings.mirror.sourceModelId': { $ne: null },
  })

  if (!model) {
    throw NotFound(`The requested mirrored model entry was not found.`, { modelId: mirroredModelId, ...logData })
  }

  if (model.settings.mirror.sourceModelId !== sourceModelId) {
    throw InternalError('The source model ID of the mirrored model does not match the model Id of the imported model', {
      sourceModelId: model.settings.mirror.sourceModelId,
      importedModelId: sourceModelId,
      ...logData,
    })
  }

  return model
}

export function isModelCardRevisionDoc(data: unknown): data is ModelCardRevisionDoc {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  // Hard to debug
  if (
    !('modelId' in data) ||
    !('schemaId' in data) ||
    !('version' in data) ||
    !('createdBy' in data) ||
    !('updatedAt' in data) ||
    !('createdAt' in data) ||
    !('_id' in data)
  ) {
    return false
  }
  return true
}

export async function getCurrentUserPermissionsByModel(
  user: UserInterface,
  modelId: string,
): Promise<EntryUserPermissions> {
  const model = await getModelById(user, modelId)

  const editEntryAuth = await authorisation.model(user, model, ModelAction.Update)
  const editEntryCardAuth = await authorisation.model(user, model, ModelAction.Write)
  const createReleaseAuth = await authorisation.release(user, model, ReleaseAction.Create)
  const editReleaseAuth = await authorisation.release(user, model, ReleaseAction.Update)
  const deleteReleaseAuth = await authorisation.release(user, model, ReleaseAction.Delete)
  const pushModelImageAuth = await authorisation.image(user, model, {
    type: 'repository',
    name: modelId,
    actions: ['push'],
  })
  // Inferencing uses model authorisation
  const createInferenceServiceAuth = await authorisation.model(user, model, ModelAction.Create)
  const editInferenceServiceAuth = await authorisation.model(user, model, ModelAction.Update)
  const exportMirroredModelAuth = await authorisation.model(user, model, ModelAction.Update)

  return {
    editEntry: authResponseToUserPermission(editEntryAuth),
    editEntryCard: authResponseToUserPermission(editEntryCardAuth),

    createRelease: authResponseToUserPermission(createReleaseAuth),
    editRelease: authResponseToUserPermission(editReleaseAuth),
    deleteRelease: authResponseToUserPermission(deleteReleaseAuth),

    pushModelImage: authResponseToUserPermission(pushModelImageAuth),

    createInferenceService: authResponseToUserPermission(createInferenceServiceAuth),
    editInferenceService: authResponseToUserPermission(editInferenceServiceAuth),

    exportMirroredModel: authResponseToUserPermission(exportMirroredModelAuth),
  }
}

export async function getModelSystemRoles(user: UserInterface, model: ModelDoc) {
  const entities = await authentication.getEntities(user)

  return model.collaborators
    .filter((collaborator) => entities.includes(collaborator.entity))
    .map((collaborator) => collaborator.roles)
    .flat()
}

export async function popularTagsForEntries() {
  const tags = await ModelModel.aggregate([{ $unwind: '$tags' }, { $sortByCount: '$tags' }, { $limit: 10 }])
  return tags.map((tag) => tag._id) as string[]
}
