import { Request } from 'express'

import { ModelDoc } from '../../../models/v2/Model.js'
import { ModelSearchResult } from '../../../routes/v2/model/getModelsSearch.js'
import { BailoError } from '../../../types/v2/error.js'

export const TypeId = {
  CreateModel: 'CreateModel',
  ViewModel: 'ViewModel',
  SearchModels: 'SearchModels',
}
export type TypeIdKeys = (typeof TypeId)[keyof typeof TypeId]

export abstract class BaseAuditConnector {
  abstract publishModelEvent(req: Request, model: ModelDoc)
  abstract publishModelSearchEvent(req: Request, models: ModelSearchResult[])
  abstract publishModelErrorEvent(req: Request, error: BailoError)
}
