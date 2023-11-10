import { Request } from 'express'

import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { ModelDoc } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ModelSearchResult } from '../../../routes/v2/model/getModelsSearch.js'
import { BailoError } from '../../../types/v2/error.js'

const AuditKind = {
  Create: 'Create',
  View: 'View',
  Update: 'Update',
  Delete: 'Delete',
  Search: 'Search',
}
export type AuditKindKeys = (typeof AuditKind)[keyof typeof AuditKind]

export const AuditInfo = {
  CreateModel: { typeId: 'CreateModel', description: 'Model Created', auditKind: AuditKind.Create },
  ViewModel: { typeId: 'ViewModel', description: 'Model Viewed', auditKind: AuditKind.View },
  UpdateModel: { typeId: 'UpdateModel', description: 'Model Updated', auditKind: AuditKind.Update },
  SearchModels: { typeId: 'SearchModels', description: 'Model Searched', auditKind: AuditKind.Search },

  CreateRelease: { typeId: 'CreateRelease', description: 'Release Created', auditKind: AuditKind.Create },
  ViewRelease: { typeId: 'ViewRelease', description: 'Release Viewed', auditKind: AuditKind.View },
  UpdateRelease: { typeId: 'UpdateRelease', description: 'Release Updated', auditKind: AuditKind.Update },
  DeleteRelease: { typeId: 'UpdateRelease', description: 'Release Deleted', auditKind: AuditKind.Update },
  SearchReleases: { typeId: 'SearchReleases', description: 'Release Searched', auditKind: AuditKind.Search },

  CreateAccessRequest: {
    typeId: 'CreateAccessRequest',
    description: 'Access Request Created',
    auditKind: AuditKind.Create,
  },
  ViewAccessRequest: { typeId: 'ViewAccessRequest', description: 'Access Request Viewed', auditKind: AuditKind.View },
  UpdateAccessRequest: {
    typeId: 'UpdateAccess Request',
    description: 'Access Request Updated',
    auditKind: AuditKind.Update,
  },
  DeleteAccessRequest: {
    typeId: 'UpdateAccessRequest',
    description: 'Access Request Deleted',
    auditKind: AuditKind.Update,
  },
  SearchAccessRequests: {
    typeId: 'SearchAccessRequests',
    description: 'Access Request Searched',
    auditKind: AuditKind.Search,
  },
}
export type AuditInfoKeys = (typeof AuditInfo)[keyof typeof AuditInfo]

export abstract class BaseAuditConnector {
  abstract onCreateModel(req: Request, model: ModelDoc)
  abstract onViewModel(req: Request, model: ModelDoc)
  abstract onSearchModel(req: Request, models: ModelSearchResult[])

  abstract onCreateRelease(req: Request, release: ReleaseDoc)
  abstract onViewRelease(req: Request, release: ReleaseDoc)
  abstract onUpdateRelease(req: Request, release: ReleaseDoc)
  abstract onDeleteRelease(req: Request, modelId: string, semver: string)
  abstract onSearchReleases(req: Request, releases: ReleaseDoc[])

  abstract onCreateAccessRequest(req: Request, accessRequest: AccessRequestDoc)
  abstract onViewAccessRequest(req: Request, accessRequest: AccessRequestDoc)
  abstract onUpdateAccessRequest(req: Request, accessRequest: AccessRequestDoc)
  abstract onDeleteAccessRequest(req: Request, accessRequestId: string)
  abstract onSearchAccessRequests(req: Request, accessRequests: AccessRequestDoc[])

  abstract onError(req: Request, error: BailoError)
}
