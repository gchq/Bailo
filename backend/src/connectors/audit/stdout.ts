import { Request } from 'express'

import { AccessRequestDoc } from '../../models/AccessRequest.js'
import { FileInterface, FileInterfaceDoc } from '../../models/File.js'
import { InferenceDoc } from '../../models/Inference.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../models/Model.js'
import { ImageRefInterface, ReleaseDoc } from '../../models/Release.js'
import { ResponseInterface } from '../../models/Response.js'
import { ReviewInterface } from '../../models/Review.js'
import { ReviewRoleInterface } from '../../models/ReviewRole.js'
import { SchemaDoc, SchemaInterface } from '../../models/Schema.js'
import { SchemaMigrationInterface } from '../../models/SchemaMigration.js'
import { TokenDoc } from '../../models/Token.js'
import { BailoError } from '../../types/error.js'
import { EntrySearchResult, MirrorInformation } from '../../types/types.js'
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

  async onViewModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.ViewModel, req)
    const event = this.generateEvent(req, { name: model.name })
    req.log.info(event, req.audit.description)
  }

  async onSearchModel(req: Request, models: EntrySearchResult[]) {
    this.checkEventType(AuditInfo.SearchModels, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: models.map((model) => model.id),
    })

    req.log.info(event, req.audit.description)
  }

  async onUpdateModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.UpdateModel, req)
    const event = this.generateEvent(req, { id: model.id })
    req.log.info(event, req.audit.description)
  }

  async onDeleteModel(req: Request, modelId: string) {
    this.checkEventType(AuditInfo.DeleteModel, req)
    const event = this.generateEvent(req, { id: modelId })
    req.log.info(event, req.audit.description)
  }

  async onCreateModelCard(req: Request, model: ModelDoc, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.CreateModelCard, req)
    const event = this.generateEvent(req, { modelId: model.id, version: modelCard.version })
    req.log.info(event, req.audit.description)
  }

  async onViewModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.ViewModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    req.log.info(event, req.audit.description)
  }

  async onViewModelCardRevisions(req: Request, _modelId, modelCards: ModelCardInterface[]) {
    this.checkEventType(AuditInfo.ViewModelCardRevisions, req)
    const event = this.generateEvent(req, { url: req.originalUrl, results: modelCards.map((model) => model.version) })
    req.log.info(event, req.audit.description)
  }

  async onUpdateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.UpdateModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    req.log.info(event, req.audit.description)
  }

  async onCreateFile(req: Request, file: FileInterfaceDoc) {
    this.checkEventType(AuditInfo.CreateFile, req)
    const event = this.generateEvent(req, { id: file._id.toString(), modelId: file.modelId })
    req.log.info(event, req.audit.description)
  }

  async onViewFile(req: Request, file: FileInterfaceDoc) {
    this.checkEventType(AuditInfo.ViewFile, req)
    const event = this.generateEvent(req, { id: file._id.toString(), modelId: file.modelId })
    req.log.info(event, req.audit.description)
  }

  async onViewFiles(req: Request, modelId: string, files: FileInterface[]) {
    this.checkEventType(AuditInfo.ViewFiles, req)
    const event = this.generateEvent(req, { modelId, results: files.map((file) => file._id.toString()) })
    req.log.info(event, req.audit.description)
  }

  async onUpdateFile(req: Request, modelId: string, fileId: string) {
    this.checkEventType(AuditInfo.UpdateFile, req)
    const event = this.generateEvent(req, { modelId, fileId })
    req.log.info(event, req.audit.description)
  }

  async onDeleteFile(req: Request, modelId: string, fileId: string) {
    this.checkEventType(AuditInfo.DeleteFile, req)
    const event = this.generateEvent(req, { modelId, fileId })
    req.log.info(event, req.audit.description)
  }

  async onCreateRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.CreateRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    req.log.info(event, req.audit.description)
  }

  async onViewRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.ViewRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    req.log.info(event, req.audit.description)
  }

  async onViewReleases(req: Request, releases: ReleaseDoc[]) {
    this.checkEventType(AuditInfo.ViewReleases, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: releases.map((release) => ({ modelId: release.modelId, semver: release.semver })),
    })
    req.log.info(event, req.audit.description)
  }

  async onUpdateRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.UpdateRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    req.log.info(event, req.audit.description)
  }

  async onDeleteRelease(req: Request, modelId: string, semver: string) {
    this.checkEventType(AuditInfo.DeleteRelease, req)
    const event = this.generateEvent(req, { modelId, semver })
    req.log.info(event, req.audit.description)
  }

  async onCreateCommentResponse(req: Request, ResponseInterface: ResponseInterface) {
    this.checkEventType(AuditInfo.CreateResponse, req)
    const event = this.generateEvent(req, { id: ResponseInterface['_id'] })
    req.log.info(event, req.audit.description)
  }

  async onCreateReviewResponse(req: Request, response: ResponseInterface) {
    this.checkEventType(AuditInfo.CreateReviewResponse, req)
    const event = this.generateEvent(req, {
      reviewId: response.parentId,
      ...(response.decision && { decision: response.decision }),
    })
    req.log.info(event, req.audit.description)
  }

  async onViewResponses(req: Request, responseInterfaces: ResponseInterface[]) {
    this.checkEventType(AuditInfo.ViewResponses, req)
    const event = this.generateEvent(req, { responseInterfaces })
    req.log.info(event, req.audit.description)
  }

  async onUpdateResponse(req: Request, responseId: string) {
    this.checkEventType(AuditInfo.UpdateResponse, req)
    const event = this.generateEvent(req, { id: responseId })
    req.log.info(event, req.audit.description)
  }

  async onCreateUserToken(req: Request, token: TokenDoc) {
    this.checkEventType(AuditInfo.CreateUserToken, req)
    const event = this.generateEvent(req, { accessKey: token.accessKey, description: token.description })
    req.log.info(event, req.audit.description)
  }

  async onViewUserTokens(req: Request, tokens: TokenDoc[]) {
    this.checkEventType(AuditInfo.ViewUserTokens, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: tokens.map((token) => token.accessKey),
    })
    req.log.info(event, req.audit.description)
  }

  async onDeleteUserToken(req: Request, accessKey: string) {
    this.checkEventType(AuditInfo.DeleteUserToken, req)
    const event = this.generateEvent(req, { accessKey })
    req.log.info(event, req.audit.description)
  }

  async onCreateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.CreateAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    req.log.info(event, req.audit.description)
  }

  async onViewAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.ViewAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    req.log.info(event, req.audit.description)
  }

  async onViewAccessRequests(req: Request, accessRequests: AccessRequestDoc[]) {
    this.checkEventType(AuditInfo.ViewAccessRequests, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: accessRequests.map((accessRequest) => ({
        id: accessRequest.id,
      })),
    })
    req.log.info(event, req.audit.description)
  }

  async onUpdateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.UpdateAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    req.log.info(event, req.audit.description)
  }

  async onDeleteAccessRequest(req: Request, accessRequestId: string) {
    this.checkEventType(AuditInfo.DeleteAccessRequest, req)
    const event = this.generateEvent(req, { accessRequestId })
    req.log.info(event, req.audit.description)
  }

  async onSearchReviews(req: Request, reviews: (ReviewInterface & { model: ModelInterface })[]) {
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

  async onCreateSchema(req: Request, schema: SchemaInterface) {
    this.checkEventType(AuditInfo.CreateSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    req.log.info(event, req.audit.description)
  }

  async onViewSchema(req: Request, schema: SchemaInterface) {
    this.checkEventType(AuditInfo.ViewSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    req.log.info(event, req.audit.description)
  }

  async onSearchSchemas(req: Request, schemas: SchemaInterface[]) {
    this.checkEventType(AuditInfo.SearchSchemas, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: schemas.map((schema) => ({ id: schema.id })),
    })
    req.log.info(event, req.audit.description)
  }

  async onUpdateSchema(req: Request, schema: SchemaDoc) {
    this.checkEventType(AuditInfo.UpdateSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    req.log.info(event, req.audit.description)
  }

  async onDeleteSchema(req: Request, schemaId: string) {
    this.checkEventType(AuditInfo.DeleteSchema, req)
    const event = this.generateEvent(req, { id: schemaId })
    req.log.info(event, req.audit.description)
  }

  async onCreateSchemaMigration(req: Request, schemaMigration: SchemaMigrationInterface) {
    this.checkEventType(AuditInfo.CreateSchemaMigration, req)
    const event = this.generateEvent(req, { schemaMigrationName: schemaMigration.name })
    req.log.info(event, req.audit.description)
  }

  async onViewSchemaMigration(req: Request, schemaMigration: SchemaMigrationInterface) {
    this.checkEventType(AuditInfo.ViewSchemaMigrations, req)
    const event = this.generateEvent(req, { schemaMigrationName: schemaMigration.name })
    req.log.info(event, req.audit.description)
  }

  async onViewSchemaMigrations(req: Request, schemaMigrations: SchemaMigrationInterface[]) {
    this.checkEventType(AuditInfo.ViewSchemaMigrations, req)
    const event = this.generateEvent(req, {
      results: schemaMigrations.map((schemaMigration) => schemaMigration.name),
    })
    req.log.info(event, req.audit.description)
  }

  async onUpdateSchemaMigration(req: Request, schemaMigration: SchemaMigrationInterface) {
    this.checkEventType(AuditInfo.UpdateSchemaMigration, req)
    const event = this.generateEvent(req, { schemaMigrationName: schemaMigration.name })
    req.log.info(event, req.audit.description)
  }

  async onCreateInference(req: Request, inference: InferenceDoc) {
    this.checkEventType(AuditInfo.CreateInference, req)
    const event = this.generateEvent(req, { modelId: inference.modelId, image: inference.image, tag: inference.tag })
    req.log.info(event, req.audit.description)
  }

  async onViewInference(req: Request, inference: InferenceDoc) {
    this.checkEventType(AuditInfo.ViewInference, req)
    const event = this.generateEvent(req, {
      modelId: inference.modelId,
      imageName: inference.image,
      imageTag: inference.tag,
    })
    req.log.info(event, req.audit.description)
  }

  async onViewInferences(req: Request, inferences: InferenceDoc[]) {
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

  async onUpdateInference(req: Request, inference: InferenceDoc) {
    this.checkEventType(AuditInfo.UpdateInference, req)
    const event = this.generateEvent(req, { modelId: inference.modelId, image: inference.image, tag: inference.tag })
    req.log.info(event, req.audit.description)
  }

  async onDeleteInference(req: Request, inference: InferenceDoc) {
    this.checkEventType(AuditInfo.DeleteInference, req)
    const event = this.generateEvent(req, { modelId: inference.modelId, image: inference.image, tag: inference.tag })
    req.log.info(event, req.audit.description)
  }

  async onViewModelImages(
    req: Request,
    modelId: string,
    images: { repository: string; name: string; tags: string[] }[],
  ) {
    this.checkEventType(AuditInfo.ViewModelImages, req)
    const event = this.generateEvent(req, {
      modelId,
      images: images.map((image) => ({ repository: image.repository, name: image.name })),
    })
    req.log.info(event, req.audit.description)
  }

  async onDeleteImage(req: Request, modelId: string, image: ImageRefInterface) {
    this.checkEventType(AuditInfo.DeleteImage, req)
    const event = this.generateEvent(req, { modelId, image })
    req.log.info(event, req.audit.description)
  }

  async onCreateS3Export(req: Request, modelId: string, semvers?: string[]) {
    this.checkEventType(AuditInfo.CreateExport, req)
    const event = this.generateEvent(req, { modelId: modelId, semvers })
    req.log.info(event, req.audit.description)
  }

  async onCreateImport(
    req: Request,
    mirroredModel: ModelInterface,
    sourceModelId: string,
    exporter: string,
    importResult: MirrorInformation,
  ) {
    this.checkEventType(AuditInfo.CreateImport, req)
    const event = this.generateEvent(req, { mirroredModel, sourceModelId, exporter, importResult })
    req.log.info(event, req.audit.description)
  }

  async onCreateReviewRole(req: Request, reviewRole: ReviewRoleInterface) {
    this.checkEventType(AuditInfo.CreateReviewRole, req)
    const event = this.generateEvent(req, { reviewRole: reviewRole.shortName })
    req.log.info(event, req.audit.description)
  }

  async onViewReviewRoles(req: Request) {
    this.checkEventType(AuditInfo.ViewReviewRoles, req)
    const event = this.generateEvent(req, {})
    req.log.info(event, req.audit.description)
  }

  async onUpdateReviewRole(req: Request, reviewRole: ReviewRoleInterface) {
    this.checkEventType(AuditInfo.UpdateReviewRole, req)
    const event = this.generateEvent(req, { reviewRole: reviewRole.shortName })
    req.log.info(event, req.audit.description)
  }

  async onDeleteReviewRole(req: Request, reviewRoleId: string) {
    this.checkEventType(AuditInfo.DeleteReviewRole, req)
    const event = this.generateEvent(req, { reviewRoleId: reviewRoleId })
    req.log.info(event, req.audit.description)
  }

  async onError(req: Request, error: BailoError) {
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
}
