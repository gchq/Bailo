import { Request } from 'express'

import { ModelDoc } from '../../../models/v2/Model.js'
import { ModelSearchResult } from '../../../routes/v2/model/getModelsSearch.js'
import log from '../../../services/v2/log.js'
import { BailoError } from '../../../types/v2/error.js'
import { AuditKind, BaseAuditConnector, TypeId, TypeIdKeys } from './Base.js'

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
    this.checkEventType(TypeId.CreateModel, req)
    const event = this.createEvent(req, this.createEventDetail('Model Created', model.name))
    log.info(event, 'Logging Event')
  }

  onGetModel(req: Request, model: ModelDoc) {
    this.checkEventType(TypeId.ViewModel, req)
    const event = this.createEvent(req, this.viewEventDetail('Model Viewed', model.name))
    log.info(event, 'Logging Event')
  }

  onSearchModel(req: Request, models: ModelSearchResult[]) {
    this.checkEventType(TypeId.ViewModel, req)
    const event = this.createEvent(
      req,
      this.searchEventDetail(
        'Searched Models',
        req.query.toString(),
        models.map((model) => model.id),
      ),
    )

    log.info(event, 'Logging Event')
  }

  /**
   * Generic audit generation
   */

  createEvent(req: Request, eventDetail) {
    return {
      EventTime: new Date().toString(),
      EventSource: {
        System: 'BAILO',
        Generator: 'BAILO',
        Device: {
          Hostname: 'http://localhost:8080',
        },
        Client: req.ip,
        User: req.user,
      },
      EventDetail: eventDetail,
    }
  }

  checkEventType(eventType: TypeIdKeys, req: Request) {
    if (eventType !== req.audit.typeId) {
      throw new Error(`Audit: Expected type '${eventType}' but recieved '${req.audit.typeId}'`)
    }
  }

  createEventDetail(description: string, name: string, outcome?: Outcome) {
    return {
      typeId: TypeId.CreateModel,
      description,
      name,
      ...(outcome && { outcome }),
    }
  }

  viewEventDetail(description: string, name: string, outcome?: Outcome) {
    return {
      typeId: TypeId.CreateModel,
      description,
      name,
      ...(outcome && { outcome }),
    }
  }

  searchEventDetail(description: string, query: string, results?: string[], outcome?: Outcome) {
    return {
      typeId: TypeId.CreateModel,
      description,
      ...(results && { results }),
      ...(outcome && { outcome }),
    }
  }

  /**
   * Generic error event
   */

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
    let eventDetail
    switch (req.audit.auditKind) {
      case AuditKind.Create:
        eventDetail = this.createEvent(req, this.createEventDetail(req.audit.typeId, req.originalUrl, outcome))
        break
      case AuditKind.View:
        eventDetail = this.createEvent(req, this.viewEventDetail(req.audit.typeId, req.originalUrl, outcome))
        break
      case AuditKind.Search:
        eventDetail = this.createEvent(
          req,
          this.searchEventDetail(req.audit.typeId, req.originalUrl, undefined, outcome),
        )
        break
      default:
        throw new Error(`Unrecognised Audit Kind. Cannot audit error. ${error}`)
    }
    const event = this.createEvent(req, eventDetail)

    log.info(event, 'Logging Event')
  }
}
