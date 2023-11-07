import { Request } from 'express'

import { ModelDoc } from '../../../models/v2/Model.js'
import { ModelSearchResult } from '../../../routes/v2/model/getModelsSearch.js'
import log from '../../../services/v2/log.js'
import { BailoError } from '../../../types/v2/error.js'
import { BaseAuditConnector, TypeId, TypeIdKeys } from './Base.js'

export class SillyAuditConnector extends BaseAuditConnector {
  constructor() {
    super()
  }

  publishModelEvent(req: Request, model: ModelDoc) {
    const event = {
      EventTime: this.getEventTime(),
      EventSource: this.getEventSource(req),
      EventDetail: this.getEventDetail(req.eventType, model.name),
    }
    log.info(event, 'Logging Event')
  }

  publishModelSearchEvent(req: Request, models: ModelSearchResult[]) {
    if (req.eventType !== TypeId.SearchModels) {
      throw new Error('Incorrect Event Detail Type ID found on request object for a search model event.')
    }
    const event = {
      EventTime: this.getEventTime(),
      EventSource: this.getEventSource(req),
      EventDetail: {
        TypeId: TypeId.SearchModels,
        Description: 'Searched models',
        Search: {
          Object: {
            Query: req.query,
            SearchResults: JSON.stringify(models),
          },
        },
      },
    }
    log.info(event, 'Logging Event')
  }

  publishModelErrorEvent(req: Request, error: BailoError) {
    let eventDetail
    if (req.eventType === TypeId.SearchModels) {
      eventDetail = {
        TypeId: TypeId.SearchModels,
        Description: 'Searched models',
        Search: {
          Object: {
            Query: req.query,
          },
          Outcome: this.getErrorOutcome(error),
        },
      }
    } else {
      eventDetail = this.getEventDetail(req.eventType, req.originalUrl, error)
    }
    const event = {
      EventTime: this.getEventTime(),
      EventSource: this.getEventSource(req),
      EventDetail: eventDetail,
    }

    log.info(event, 'Logging Event')
  }

  getEventTime() {
    return new Date().toString()
  }

  getEventSource(req: Request) {
    return {
      System: 'BAILO',
      Generator: 'BAILO',
      Device: {
        Hostname: 'http://localhost:8080',
      },
      Client: req.ip,
      User: req.user,
    }
  }

  getEventDetail(typeId: TypeIdKeys, modelName: string, error?: BailoError) {
    let eventDetail
    const outcome = this.getErrorOutcome(error)

    switch (typeId) {
      case TypeId.CreateModel:
        eventDetail = {
          TypeId: TypeId.CreateModel,
          Description: 'Model Created',
          Create: {
            Object: {
              Name: modelName,
            },
          },
        }
        if (error) {
          eventDetail.Create.Outcome = outcome
        }
        return eventDetail
      case TypeId.ViewModel:
        eventDetail = {
          TypeId: TypeId.ViewModel,
          Description: 'Model Retrieved',
          View: {
            Object: {
              Name: modelName,
            },
          },
        }
        if (error) {
          eventDetail.View.Outcome = outcome
        }
        return eventDetail
      case TypeId.SearchModels:
        if (!error) {
          eventDetail.View.Outcome = outcome
        }
        eventDetail = {
          TypeId: TypeId.ViewModel,
          Description: 'Model Retrieved',
          View: {
            Object: {
              Name: modelName,
            },
          },
        }
        if (error) {
          eventDetail.View.Outcome = outcome
        }
        return eventDetail
      default:
        throw new Error('Unrecognised Event Detail Type ID found on request object.')
    }
  }

  getErrorOutcome(error: BailoError | undefined) {
    if (error && error.code === 403) {
      return {
        Description: 'User does not have permission to execute the request',
        Permitted: false,
        Success: false,
      }
    } else if (error) {
      return {
        Description: error.message,
        Success: false,
      }
    }
  }
}
