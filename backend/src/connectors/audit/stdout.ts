import { Request } from 'express'

import { AccessRequestDoc } from '../../models/AccessRequest.js'
import { FileInterface, FileInterfaceDoc } from '../../models/File.js'
import { InferenceDoc } from '../../models/Inference.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../models/Model.js'
import { ReleaseDoc } from '../../models/Release.js'
import { ResponseInterface } from '../../models/Response.js'
import { ReviewInterface } from '../../models/Review.js'
import { SchemaDoc, SchemaInterface } from '../../models/Schema.js'
import { TokenDoc } from '../../models/Token.js'
import { UserSettingsInterface } from '../../models/UserSettings.js'
import { ModelSearchResult } from '../../routes/v2/model/getModelsSearch.js'
import { BailoError } from '../../types/error.js'
import { AuditInfo, BaseAuditConnector } from './Base.js'

interface Outcome {
  Success: boolean
  Description: string
  Permitted?: boolean
}

export class StdoutAuditConnector extends BaseAuditConnector {
  constructor() {
    super()
  }

  async onCreateModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.CreateModel, req)
    const event = this.generateEvent(req, { id: model.id })
    req.log.info(event, req.audit.description)
  }

  onViewModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.ViewModel, req)
    const event = this.generateEvent(req, { name: model.name })
    req.log.info(event, req.audit.description)
  }

  onUpdateModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.UpdateModel, req)
    const event = this.generateEvent(req, { id: model.id })
    req.log.info(event, req.audit.description)
  }

  onSearchModel(req: Request, models: ModelSearchResult[]) {
    this.checkEventType(AuditInfo.SearchModels, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: models.map((model) => model.id),
    })

    req.log.info(event, req.audit.description)
  }

  onCreateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.CreateModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    req.log.info(event, req.audit.description)
  }

  onViewModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.ViewModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    req.log.info(event, req.audit.description)
  }

  onUpdateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.UpdateModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    req.log.info(event, req.audit.description)
  }

  onViewModelCardRevisions(req: Request, _modelId, modelCards: ModelCardInterface[]) {
    this.checkEventType(AuditInfo.ViewModelCardRevisions, req)
    const event = this.generateEvent(req, { url: req.originalUrl, results: modelCards.map((model) => model.version) })
    req.log.info(event, req.audit.description)
  }

  onCreateFile(req: Request, file: FileInterfaceDoc) {
    this.checkEventType(AuditInfo.CreateFile, req)
    const event = this.generateEvent(req, { id: file._id, modelId: file.modelId })
    req.log.info(event, req.audit.description)
  }

  onViewFile(req: Request, file: FileInterfaceDoc) {
    this.checkEventType(AuditInfo.ViewFile, req)
    const event = this.generateEvent(req, { id: file._id.toString(), modelId: file.modelId })
    req.log.info(event, req.audit.description)
  }

  onViewFiles(req: Request, modelId: string, files: FileInterface[]) {
    this.checkEventType(AuditInfo.ViewFiles, req)
    const event = this.generateEvent(req, { modelId, results: files.map((file) => file._id) })
    req.log.info(event, req.audit.description)
  }

  onDeleteFile(req: Request, modelId: string, fileId: string) {
    this.checkEventType(AuditInfo.DeleteFile, req)
    const event = this.generateEvent(req, { modelId, fileId })
    req.log.info(event, req.audit.description)
  }

  onCreateRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.CreateRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    req.log.info(event, req.audit.description)
  }

  onViewRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.ViewRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    req.log.info(event, req.audit.description)
  }

  onUpdateRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.UpdateRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    req.log.info(event, req.audit.description)
  }

  onDeleteRelease(req: Request, modelId: string, semver: string) {
    this.checkEventType(AuditInfo.DeleteRelease, req)
    const event = this.generateEvent(req, { modelId, semver })
    req.log.info(event, req.audit.description)
  }

  onViewReleases(req: Request, releases: ReleaseDoc[]) {
    this.checkEventType(AuditInfo.ViewReleases, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: releases.map((release) => ({ modelId: release.modelId, semver: release.semver })),
    })
    req.log.info(event, req.audit.description)
  }

  onCreateUserToken(req: Request, token: TokenDoc) {
    this.checkEventType(AuditInfo.CreateUserToken, req)
    const event = this.generateEvent(req, { accessKey: token.accessKey, description: token.description })
    req.log.info(event, req.audit.description)
  }

  onViewUserTokens(req: Request, tokens: TokenDoc[]) {
    this.checkEventType(AuditInfo.ViewUserTokens, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: tokens.map((token) => token.accessKey),
    })
    req.log.info(event, req.audit.description)
  }

  onDeleteUserToken(req: Request, accessKey: string) {
    this.checkEventType(AuditInfo.DeleteUserToken, req)
    const event = this.generateEvent(req, { accessKey })
    req.log.info(event, req.audit.description)
  }

  onCreateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.CreateAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    req.log.info(event, req.audit.description)
  }

  onViewAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.ViewAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    req.log.info(event, req.audit.description)
  }

  onUpdateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.UpdateAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    req.log.info(event, req.audit.description)
  }

  onDeleteAccessRequest(req: Request, accessRequestId: string) {
    this.checkEventType(AuditInfo.DeleteAccessRequest, req)
    const event = this.generateEvent(req, { accessRequestId })
    req.log.info(event, req.audit.description)
  }

  onViewAccessRequests(req: Request, accessRequests: AccessRequestDoc[]) {
    this.checkEventType(AuditInfo.ViewAccessRequests, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: accessRequests.map((accessRequest) => ({
        id: accessRequest.id,
      })),
    })
    req.log.info(event, req.audit.description)
  }

  onSearchReviews(req: Request, reviews: (ReviewInterface & { model: ModelInterface })[]) {
    this.checkEventType(AuditInfo.SearchReviews, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: reviews.map((review) => ({
        modelId: review.modelId,
        ...(review.semver && { semver: review.semver }),
        ...(review.accessRequestId && { semver: review.accessRequestId }),
      })),
    })
    req.log.info(event, req.audit.description)
  }

  onCreateReviewResponse(req: Request, response: ResponseInterface) {
    this.checkEventType(AuditInfo.CreateReviewResponse, req)
    const event = this.generateEvent(req, {
      reviewId: response.parentId,
      ...(response.decision && { decision: response.decision }),
    })
    req.log.info(event, req.audit.description)
  }

  onViewResponses(req: Request, responseInterfaces: ResponseInterface[]) {
    this.checkEventType(AuditInfo.ViewResponses, req)
    const event = this.generateEvent(req, { responseInterfaces })
    req.log.info(event, req.audit.description)
  }

  onCreateCommentResponse(req: Request, ResponseInterface: ResponseInterface) {
    this.checkEventType(AuditInfo.CreateResponse, req)
    const event = this.generateEvent(req, { id: ResponseInterface['_id'] })
    req.log.info(event, req.audit.description)
  }

  onUpdateResponse(req: Request, responseId: string) {
    this.checkEventType(AuditInfo.UpdateResponse, req)
    const event = this.generateEvent(req, { id: responseId })
    req.log.info(event, req.audit.description)
  }

  onError(req: Request, error: BailoError) {
    if (!req.audit) {
      // No audit information has been attached to the request
      return
    }
    const outcome =
      error.code === 403
        ? {
            Description: 'User does not have permission to execute the request',
            Permitted: false,
            Success: false,
          }
        : {
            Description: error.message,
            Success: false,
          }
    const event = this.generateEvent(req, { url: req.originalUrl, httpMethod: req.method }, outcome)

    req.log.info(event, req.audit.description)
  }

  generateEvent(req: Request, resourceInfo: object, outcome?: Outcome) {
    return {
      typeId: req.audit.typeId,
      resource: resourceInfo,
      ...(outcome && { outcome }),
    }
  }

  onCreateSchema(req: Request, schema: SchemaInterface) {
    this.checkEventType(AuditInfo.CreateSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    req.log.info(event, req.audit.description)
  }

  onViewSchema(req: Request, schema: SchemaInterface) {
    this.checkEventType(AuditInfo.ViewSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    req.log.info(event, req.audit.description)
  }

  onUpdateSchema(req: Request, schema: SchemaDoc) {
    this.checkEventType(AuditInfo.UpdateSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    req.log.info(event, req.audit.description)
  }

  onDeleteSchema(req: Request, schemaId: string) {
    this.checkEventType(AuditInfo.DeleteSchema, req)
    const event = this.generateEvent(req, { id: schemaId })
    req.log.info(event, req.audit.description)
  }

  onSearchSchemas(req: Request, schemas: SchemaInterface[]) {
    this.checkEventType(AuditInfo.SearchSchemas, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: schemas.map((schema) => ({ id: schema.id })),
    })
    req.log.info(event, req.audit.description)
  }

  onViewModelImages(req: Request, modelId: string, images: { repository: string; name: string; tags: string[] }[]) {
    this.checkEventType(AuditInfo.ViewModelImages, req)
    const event = this.generateEvent(req, {
      modelId,
      images: images.map((image) => ({ repository: image.repository, name: image.name })),
    })
    req.log.info(event, req.audit.description)
  }

  onViewInference(req: Request, inference: InferenceDoc) {
    this.checkEventType(AuditInfo.ViewInference, req)
    const event = this.generateEvent(req, {
      modelId: inference.modelId,
      imageName: inference.image,
      imageTag: inference.tag,
    })
    req.log.info(event, req.audit.description)
  }

  onViewInferences(req: Request, inferences: InferenceDoc[]) {
    this.checkEventType(AuditInfo.ViewInferences, req)
    const event = this.generateEvent(req, {
      results: inferences.map((inference) => ({
        modelId: inference.modelId,
        image: inference.image,
        tag: inference.tag,
      })),
    })
    req.log.info(event, req.audit.description)
  }

  onCreateInference(req: Request, inference: InferenceDoc) {
    this.checkEventType(AuditInfo.CreateInference, req)
    const event = this.generateEvent(req, { modelId: inference.modelId, image: inference.image, tag: inference.tag })
    req.log.info(event, req.audit.description)
  }

  onUpdateInference(req: Request, inference: InferenceDoc) {
    this.checkEventType(AuditInfo.UpdateInference, req)
    const event = this.generateEvent(req, { modelId: inference.modelId, image: inference.image, tag: inference.tag })
    req.log.info(event, req.audit.description)
  }

  onCreateS3Export(req: Request, modelId: string, semvers?: string[]) {
    this.checkEventType(AuditInfo.CreateExport, req)
    const event = this.generateEvent(req, { modelId: modelId, semvers })
    req.log.info(event, req.audit.description)
  }

  onViewUserSettings(req: Request, userSettings: UserSettingsInterface) {
    this.checkEventType(AuditInfo.ViewUserSettings, req)
    const event = this.generateEvent(req, {
      userSettings,
    })
    req.log.info(event, req.audit.description)
  }

  onUpdateUserSettings(req: Request, userSettings: UserSettingsInterface) {
    this.checkEventType(AuditInfo.ViewUserSettings, req)
    const event = this.generateEvent(req, {
      userSettings,
    })
    req.log.info(event, req.audit.description)
  }
  onCreateImport(req: Request, mirroredModelId: string, sourceModelId: string, modelCardVersions: number[]) {
    this.checkEventType(AuditInfo.CreateImport, req)
    const event = this.generateEvent(req, { mirroredModelId, sourceModelId, modelCardVersions })
    req.log.info(event, req.audit.description)
  }
}
