import { Request } from 'express'

import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { FileInterface, FileInterfaceDoc } from '../../../models/v2/File.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ReviewInterface } from '../../../models/v2/Review.js'
import { SchemaInterface } from '../../../models/v2/Schema.js'
import { TokenDoc } from '../../../models/v2/Token.js'
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

  CreateModelCard: { typeId: 'CreateModelCard', description: 'Model Card Created', auditKind: AuditKind.Create },
  ViewModelCard: { typeId: 'ViewModelCard', description: 'Model Card Viewed', auditKind: AuditKind.View },
  ViewModelCardRevisions: {
    typeId: 'ViewModelCardRevisions',
    description: 'Model Card Revisions Viewed',
    auditKind: AuditKind.View,
  },
  UpdateModelCard: { typeId: 'UpdateModelCard', description: 'Model Card Updated', auditKind: AuditKind.Update },

  CreateFile: { typeId: 'CreateFile', description: 'File Information Created', auditKind: AuditKind.Create },
  ViewFiles: { typeId: 'ViewFiles', description: 'File Information Viewed', auditKind: AuditKind.View },
  DeleteFile: { typeId: 'DeleteFile', description: 'File Information Deleted', auditKind: AuditKind.Delete },

  CreateRelease: { typeId: 'CreateRelease', description: 'Release Created', auditKind: AuditKind.Create },
  ViewRelease: { typeId: 'ViewRelease', description: 'Release Viewed', auditKind: AuditKind.View },
  UpdateRelease: { typeId: 'UpdateRelease', description: 'Release Updated', auditKind: AuditKind.Update },
  DeleteRelease: { typeId: 'DeleteRelease', description: 'Release Deleted', auditKind: AuditKind.Delete },
  SearchReleases: { typeId: 'SearchReleases', description: 'Release Searched', auditKind: AuditKind.Search },

  CreateUserToken: { typeId: 'CreateUserToken', description: 'Token Created', auditKind: AuditKind.Create },
  ViewUserTokens: { typeId: 'ViewUserToken', description: 'Token Viewed', auditKind: AuditKind.View },
  DeleteUserToken: { typeId: 'DeleteUserToken', description: 'Token Deleted', auditKind: AuditKind.Delete },

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

  SearchReviews: {
    typeId: 'SearchReviews',
    description: 'Reviews Searched',
    auditKind: AuditKind.Search,
  },
  CreateReviewResponse: {
    typeId: 'CreateReviewResponse',
    description: 'Review Response Created',
    auditKind: AuditKind.Create,
  },

  CreateSchema: { typeId: 'CreateSchema', description: 'Schema Created', auditKind: AuditKind.Create },
  SearchSchemas: { typeId: 'SearchedSchemas', description: 'Schemas Searched', auditKind: AuditKind.Search },
  ViewSchema: { typeId: 'ViewSchema', description: 'Schema Viewed', auditKind: AuditKind.View },

  ViewModelImages: { typeId: 'ViewModelImages', description: 'Model Images Viewed', auditKind: AuditKind.View },
}
export type AuditInfoKeys = (typeof AuditInfo)[keyof typeof AuditInfo]

export abstract class BaseAuditConnector {
  abstract onCreateModel(req: Request, model: ModelDoc)
  abstract onViewModel(req: Request, model: ModelDoc)
  abstract onUpdateModel(req: Request, model: ModelDoc)
  abstract onSearchModel(req: Request, models: ModelSearchResult[])

  abstract onCreateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface)
  abstract onViewModelCard(req: Request, modelId: string, modelCard: ModelCardInterface)
  abstract onUpdateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface)
  abstract onViewModelCardRevisions(req: Request, modelCards: ModelCardInterface[])

  abstract onCreateFile(req: Request, file: FileInterfaceDoc)
  abstract onViewFiles(req: Request, modelId: string, files: FileInterface[])
  abstract onDeleteFile(req: Request, modelId: string, fileId: string)

  abstract onCreateRelease(req: Request, release: ReleaseDoc)
  abstract onViewRelease(req: Request, release: ReleaseDoc)
  abstract onUpdateRelease(req: Request, release: ReleaseDoc)
  abstract onDeleteRelease(req: Request, modelId: string, semver: string)
  abstract onSearchReleases(req: Request, releases: ReleaseDoc[])

  abstract onCreateUserToken(req: Request, token: TokenDoc)
  abstract onViewUserTokens(req: Request, tokens: TokenDoc[])
  abstract onDeleteUserToken(req: Request, accessKey: string)

  abstract onCreateAccessRequest(req: Request, accessRequest: AccessRequestDoc)
  abstract onViewAccessRequest(req: Request, accessRequest: AccessRequestDoc)
  abstract onUpdateAccessRequest(req: Request, accessRequest: AccessRequestDoc)
  abstract onDeleteAccessRequest(req: Request, accessRequestId: string)
  abstract onSearchAccessRequests(req: Request, accessRequests: AccessRequestDoc[])

  abstract onSearchReviews(req: Request, reviews: (ReviewInterface & { model: ModelInterface })[])
  abstract onCreateReviewResponse(req: Request, review: ReviewInterface)

  abstract onSearchSchemas(req: Request, schemas: SchemaInterface[])
  abstract onCreateSchema(req: Request, schema: SchemaInterface)
  abstract onViewSchema(req: Request, schema: SchemaInterface)
  abstract onDeleteSchema(req: Request, schemaId: string)

  abstract onViewModelImages(
    req: Request,
    modelId: string,
    images: { repository: string; name: string; tags: string[] }[],
  )

  abstract onError(req: Request, error: BailoError)

  checkEventType(auditInfo: AuditInfoKeys, req: Request) {
    if (auditInfo.typeId !== req.audit.typeId && auditInfo.description !== req.audit.description) {
      throw new Error(`Audit: Expected type '${JSON.stringify(auditInfo)}' but recieved '${JSON.stringify(req.audit)}'`)
    }
  }
}
