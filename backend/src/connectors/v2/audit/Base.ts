import { Request } from 'express'

import { ModelDoc } from '../../../models/v2/Model.js'
import { ModelSearchResult } from '../../../routes/v2/model/getModelsSearch.js'
import { BailoError } from '../../../types/v2/error.js'

export const AuditKind = {
  Create: 'Create',
  View: 'View',
  Search: 'Search',
}
export type AuditKindKeys = (typeof AuditKind)[keyof typeof AuditKind]

export const TypeId = {
  CreateModel: 'CreateModel',
  ViewModel: 'ViewModel',
  SearchModels: 'SearchModels',
}
export type TypeIdKeys = (typeof TypeId)[keyof typeof TypeId]

export abstract class BaseAuditConnector {
  abstract onCreateModel(req: Request, model: ModelDoc)
  abstract onGetModel(req: Request, model: ModelDoc)
  abstract onSearchModel(req: Request, models: ModelSearchResult[])

  abstract onError(req: Request, error: BailoError)
}
