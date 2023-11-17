import { Request } from 'express'

import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { FileInterface, FileInterfaceDoc } from '../../../models/v2/File.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ReviewInterface } from '../../../models/v2/Review.js'
import { SchemaInterface } from '../../../models/v2/Schema.js'
import { ModelSearchResult } from '../../../routes/v2/model/getModelsSearch.js'
import log from '../../../services/v2/log.js'
import { BailoError } from '../../../types/v2/error.js'
import { AuditInfo, AuditInfoKeys, BaseAuditConnector } from './Base.js'

interface Outcome {
  Success: boolean
  Description: string
  Permitted?: boolean
}

export class SillyAuditConnector extends BaseAuditConnector {
  constructor() {
    super()
  }

  /**
   * Model Events
   */

  onCreateModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.CreateModel, req)
    const event = this.generateEvent(req, { id: model.id })
    log.info(event, 'Logging Event')
  }

  onViewModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.ViewModel, req)
    const event = this.generateEvent(req, { name: model.name })
    log.info(event, 'Logging Event')
  }

  onUpdateModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.UpdateModel, req)
    const event = this.generateEvent(req, { id: model.id })
    log.info(event, 'Logging Event')
  }

  onSearchModel(req: Request, models: ModelSearchResult[]) {
    this.checkEventType(AuditInfo.SearchModels, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: models.map((model) => model.id),
    })

    log.info(event, 'Logging Event')
  }

  onCreateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.CreateModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    log.info(event, 'Logging Event')
  }

  onViewModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.ViewModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    log.info(event, 'Logging Event')
  }

  onUpdateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.UpdateModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    log.info(event, 'Logging Event')
  }

  onViewModelCardRevisions(req: Request, modelCards: ModelCardInterface[]) {
    this.checkEventType(AuditInfo.ViewModelCardRevisions, req)
    const event = this.generateEvent(req, { url: req.originalUrl, results: modelCards.map((model) => model.version) })
    log.info(event, 'Logging Event')
  }

  onCreateFile(req: Request, file: FileInterfaceDoc) {
    this.checkEventType(AuditInfo.CreateFile, req)
    const event = this.generateEvent(req, { id: file._id, modelId: file.modelId })
    log.info(event, 'Logging Event')
  }

  onViewFiles(req: Request, modelId: string, files: FileInterface[]) {
    this.checkEventType(AuditInfo.ViewFiles, req)
    const event = this.generateEvent(req, { modelId, results: files.map((file) => file.name) })
    log.info(event, 'Logging Event')
  }

  onDeleteFile(req: Request, modelId: string, fileId: string) {
    this.checkEventType(AuditInfo.DeleteFile, req)
    const event = this.generateEvent(req, { modelId, fileId })
    log.info(event, 'Logging Event')
  }

  /**
   * Release Events
   */

  onCreateRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.CreateRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    log.info(event, 'Logging Event')
  }

  onViewRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.ViewRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    log.info(event, 'Logging Event')
  }

  onUpdateRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.UpdateRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    log.info(event, 'Logging Event')
  }

  onDeleteRelease(req: Request, modelId: string, semver: string) {
    this.checkEventType(AuditInfo.DeleteRelease, req)
    const event = this.generateEvent(req, { modelId, semver })
    log.info(event, 'Logging Event')
  }

  onSearchReleases(req: Request, releases: ReleaseDoc[]) {
    this.checkEventType(AuditInfo.SearchReleases, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: releases.map((release) => ({ modelId: release.modelId, semver: release.semver })),
    })
    log.info(event, 'Logging Event')
  }

  onCreateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.CreateAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    log.info(event, 'Logging Event')
  }

  onViewAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.ViewAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    log.info(event, 'Logging Event')
  }

  onUpdateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.UpdateAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    log.info(event, 'Logging Event')
  }

  onDeleteAccessRequest(req: Request, accessRequestId: string) {
    this.checkEventType(AuditInfo.DeleteAccessRequest, req)
    const event = this.generateEvent(req, { accessRequestId })
    log.info(event, 'Logging Event')
  }

  onSearchAccessRequests(req: Request, accessRequests: AccessRequestDoc[]) {
    this.checkEventType(AuditInfo.SearchAccessRequests, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: accessRequests.map((accessRequest) => ({
        id: accessRequest.id,
      })),
    })
    log.info(event, 'Logging Event')
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
    log.info(event, 'Logging Event')
  }

  onCreateReviewResponse(req: Request, review: ReviewInterface) {
    this.checkEventType(AuditInfo.CreateAccessRequest, req)
    const event = this.generateEvent(req, {
      modelId: review.modelId,
      ...(review.semver && { semver: review.semver }),
      ...(review.accessRequestId && { semver: review.accessRequestId }),
    })
    log.info(event, 'Logging Event')
  }

  onError(req: Request, error: BailoError) {
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

    log.info(event, 'Logging Event')
  }

  generateEvent(req: Request, resourceInfo: object, outcome?: Outcome) {
    return {
      EventTime: new Date().toString(),
      EventSource: {
        System: 'BAILO',
        Device: {
          Hostname: 'http://localhost:8080',
        },
        Client: req.ip,
        User: req.user,
      },
      EventDetail: {
        typeId: req.audit.typeId,
        description: req.audit.description,
        resource: JSON.stringify(resourceInfo),
        ...(outcome && { outcome }),
      },
    }
  }

  onCreateSchema(req: Request, schema: SchemaInterface) {
    this.checkEventType(AuditInfo.CreateSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    log.info(event, 'Logging Event')
  }

  onViewSchema(req: Request, schema: SchemaInterface) {
    this.checkEventType(AuditInfo.ViewSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    log.info(event, 'Logging Event')
  }

  onSearchSchemas(req: Request, schemas: SchemaInterface[]) {
    this.checkEventType(AuditInfo.SearchSchemas, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: schemas.map((schema) => ({ id: schema.id })),
    })
    log.info(event, 'Logging Event')
  }

  onSearchImages(req: Request, images: { repository: string; name: string; tags: string[] }[]) {
    this.checkEventType(AuditInfo.SearchImages, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: images.map((image) => ({ repository: image.repository, name: image.name })),
    })
    log.info(event, 'Logging Event')
  }

  checkEventType(auditInfo: AuditInfoKeys, req: Request) {
    if (auditInfo.typeId !== req.audit.typeId && auditInfo.description !== req.audit.description) {
      throw new Error(`Audit: Expected type '${JSON.stringify(auditInfo)}' but recieved '${JSON.stringify(req.audit)}'`)
    }
  }
}
