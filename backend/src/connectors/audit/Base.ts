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
import { ModelSearchResult } from '../../routes/v2/model/getModelsSearch.js'
import { BailoError } from '../../types/error.js'

const AuditKind = {
  Create: 'Create',
  View: 'View',
  Update: 'Update',
  Delete: 'Delete',
  Search: 'Search',
} as const
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
  ViewFile: { typeId: 'ViewFile', description: 'File Downloaded', auditKind: AuditKind.View },
  ViewFiles: { typeId: 'ViewFiles', description: 'File Information Viewed', auditKind: AuditKind.View },
  DeleteFile: { typeId: 'DeleteFile', description: 'File Information Deleted', auditKind: AuditKind.Delete },
  UpdateFile: { typeId: 'UpdateFile', description: 'File Information Updated', auditKind: AuditKind.Update },

  CreateRelease: { typeId: 'CreateRelease', description: 'Release Created', auditKind: AuditKind.Create },
  ViewRelease: { typeId: 'ViewRelease', description: 'Release Viewed', auditKind: AuditKind.View },
  UpdateRelease: { typeId: 'UpdateRelease', description: 'Release Updated', auditKind: AuditKind.Update },
  DeleteRelease: { typeId: 'DeleteRelease', description: 'Release Deleted', auditKind: AuditKind.Delete },
  ViewReleases: { typeId: 'ViewReleases', description: 'Releases Viewed', auditKind: AuditKind.View },

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
  ViewAccessRequests: {
    typeId: 'ViewAccessRequests',
    description: 'Access Requests Viewed',
    auditKind: AuditKind.View,
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
  UpdateReviewResponse: {
    typeId: 'UpdateReviewResponse',
    description: 'Review Response Updated',
    auditKind: AuditKind.Update,
  },

  CreateSchema: { typeId: 'CreateSchema', description: 'Schema Created', auditKind: AuditKind.Create },
  SearchSchemas: { typeId: 'SearchedSchemas', description: 'Schemas Searched', auditKind: AuditKind.Search },
  ViewSchema: { typeId: 'ViewSchema', description: 'Schema Viewed', auditKind: AuditKind.View },
  DeleteSchema: { typeId: 'DeleteSchema', description: 'Schema Deleted', auditKind: AuditKind.Delete },
  UpdateSchema: { typeId: 'UpdateSchema', description: 'Schema Updated', auditKind: AuditKind.Update },

  ViewModelImages: { typeId: 'ViewModelImages', description: 'Model Images Viewed', auditKind: AuditKind.View },

  CreateInference: { typeId: 'CreateInference', description: 'Inference Service Created', auditKind: AuditKind.Create },
  UpdateInference: { typeId: 'UpdateInference', description: 'Inference Service Updated', auditKind: AuditKind.Update },
  ViewInference: { typeId: 'ViewInference', description: 'Inference Service Viewed', auditKind: AuditKind.View },
  ViewInferences: { typeId: 'ViewInferences', description: 'Inferences Viewed', auditKind: AuditKind.View },

  CreateExport: { typeId: 'CreateExport', description: 'Model Exported', auditKind: AuditKind.Create },
  CreateImport: { typeId: 'CreateImport', description: 'Model Imported', auditKind: AuditKind.Create },

  ViewResponses: {
    typeId: 'ViewResponses',
    description: 'View a list of responses',
    auditKind: AuditKind.View,
  },
  CreateResponse: {
    typeId: 'CreateResponse',
    description: 'Review or comment responses created',
    auditKind: AuditKind.Create,
  },
  UpdateResponse: {
    typeId: 'UpdateResponse',
    description: 'Updated a comment or review response',
    auditKind: AuditKind.Update,
  },
} as const
export type AuditInfoKeys = (typeof AuditInfo)[keyof typeof AuditInfo]

export abstract class BaseAuditConnector {
  abstract onCreateModel(req: Request, model: ModelDoc)
  abstract onViewModel(req: Request, model: ModelDoc)
  abstract onUpdateModel(req: Request, model: ModelDoc)
  abstract onSearchModel(req: Request, models: ModelSearchResult[])

  abstract onCreateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface)
  abstract onViewModelCard(req: Request, modelId: string, modelCard: ModelCardInterface)
  abstract onUpdateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface)
  abstract onViewModelCardRevisions(req: Request, modelId: string, modelCards: ModelCardInterface[])

  abstract onCreateFile(req: Request, file: FileInterfaceDoc)
  abstract onViewFile(req: Request, file: FileInterfaceDoc)
  abstract onViewFiles(req: Request, modelId: string, files: FileInterface[])
  abstract onDeleteFile(req: Request, modelId: string, fileId: string)
  abstract onUpdateFile(req: Request, modelId: string, fileId: string)

  abstract onCreateRelease(req: Request, release: ReleaseDoc)
  abstract onViewRelease(req: Request, release: ReleaseDoc)
  abstract onUpdateRelease(req: Request, release: ReleaseDoc)
  abstract onDeleteRelease(req: Request, modelId: string, semver: string)
  abstract onViewReleases(req: Request, releases: ReleaseDoc[])

  abstract onCreateCommentResponse(req: Request, response: ResponseInterface)
  abstract onCreateReviewResponse(req: Request, response: ResponseInterface)

  abstract onViewResponses(req: Request, responseInterfaces: ResponseInterface[])
  abstract onUpdateResponse(req: Request, responseId: string)

  abstract onCreateUserToken(req: Request, token: TokenDoc)
  abstract onViewUserTokens(req: Request, tokens: TokenDoc[])
  abstract onDeleteUserToken(req: Request, accessKey: string)

  abstract onCreateAccessRequest(req: Request, accessRequest: AccessRequestDoc)
  abstract onViewAccessRequest(req: Request, accessRequest: AccessRequestDoc)
  abstract onUpdateAccessRequest(req: Request, accessRequest: AccessRequestDoc)
  abstract onDeleteAccessRequest(req: Request, accessRequestId: string)
  abstract onViewAccessRequests(req: Request, accessRequests: AccessRequestDoc[])

  abstract onSearchReviews(req: Request, reviews: (ReviewInterface & { model: ModelInterface })[])

  abstract onSearchSchemas(req: Request, schemas: SchemaInterface[])
  abstract onCreateSchema(req: Request, schema: SchemaInterface)
  abstract onViewSchema(req: Request, schema: SchemaInterface)
  abstract onDeleteSchema(req: Request, schemaId: string)
  abstract onUpdateSchema(req: Request, schema: SchemaDoc)

  abstract onCreateInference(req: Request, inference: InferenceDoc)
  abstract onUpdateInference(req: Request, inference: InferenceDoc)
  abstract onViewInference(req: Request, inference: InferenceDoc)
  abstract onViewInferences(req: Request, inference: InferenceDoc[])

  abstract onViewModelImages(
    req: Request,
    modelId: string,
    images: { repository: string; name: string; tags: string[] }[],
  )

  abstract onCreateS3Export(req: Request, modelId: string, semvers?: string[])
  abstract onCreateImport(
    req: Request,
    mirroredModel: ModelInterface,
    sourceModelId: string,
    modelCardVersions: number[],
    exporter: string,
    newModelCards: ModelCardInterface[],
  )

  abstract onError(req: Request, error: BailoError)

  checkEventType(auditInfo: AuditInfoKeys, req: Request) {
    if (auditInfo.typeId !== req.audit.typeId && auditInfo.description !== req.audit.description) {
      throw new Error(`Audit: Expected type '${JSON.stringify(auditInfo)}' but received '${JSON.stringify(req.audit)}'`)
    }
  }
}
