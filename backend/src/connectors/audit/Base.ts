import { Request } from 'express'

import { AccessRequestDoc } from '../../models/AccessRequest.js'
import { FileInterface } from '../../models/File.js'
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
  DeleteModel: { typeId: 'DeleteModel', description: 'Model Deleted', auditKind: AuditKind.Delete },
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

  CreateSchemaMigration: {
    typeId: 'CreateSchemaMigration',
    description: 'Schema Migration Plan Created',
    auditKind: AuditKind.Create,
  },
  UpdateSchemaMigration: {
    typeId: 'UpdateSchemaMigration',
    description: 'Schema Migration Plan Updated',
    auditKind: AuditKind.Update,
  },
  ViewSchemaMigrations: {
    typeId: 'ViewSchemaMigrations',
    description: 'Schemas Migration Plans viewed',
    auditKind: AuditKind.View,
  },
  ViewSchemaMigration: {
    typeId: 'ViewSchemaMigration',
    description: 'Schema Migration Plan viewed',
    auditKind: AuditKind.View,
  },

  ViewModelImages: { typeId: 'ViewModelImages', description: 'Model Images Viewed', auditKind: AuditKind.View },
  DeleteImage: { typeId: 'DeleteImage', description: 'Image Information Deleted', auditKind: AuditKind.Delete },

  CreateInference: { typeId: 'CreateInference', description: 'Inference Service Created', auditKind: AuditKind.Create },
  UpdateInference: { typeId: 'UpdateInference', description: 'Inference Service Updated', auditKind: AuditKind.Update },
  ViewInference: { typeId: 'ViewInference', description: 'Inference Service Viewed', auditKind: AuditKind.View },
  ViewInferences: { typeId: 'ViewInferences', description: 'Inferences Viewed', auditKind: AuditKind.View },
  DeleteInference: { typeId: 'DeleteInferences', description: 'Inferences Deleted', auditKind: AuditKind.Delete },

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
  CreateReviewRole: {
    typeId: 'CreateReviewRole',
    description: 'Created a new review role',
    auditKind: AuditKind.Create,
  },
  UpdateReviewRole: {
    typeId: 'UpdateReviewRole',
    description: 'Updated an existing review role',
    auditKind: AuditKind.Update,
  },
  ViewReviewRoles: {
    typeId: 'ViewReviewRole',
    description: 'Viewed a list of review roles',
    auditKind: AuditKind.View,
  },
  DeleteReviewRole: {
    typeId: 'DeleteReviewRole',
    description: 'Delete a list of review roles',
    auditKind: AuditKind.Delete,
  },
} as const
export type AuditInfoKeys = (typeof AuditInfo)[keyof typeof AuditInfo]

export abstract class BaseAuditConnector {
  abstract onCreateModel(req: Request, model: ModelDoc): Promise<void>
  abstract onViewModel(req: Request, model: ModelDoc): Promise<void>
  abstract onSearchModel(req: Request, models: EntrySearchResult[]): Promise<void>
  abstract onUpdateModel(req: Request, model: ModelDoc): Promise<void>
  abstract onDeleteModel(req: Request, modelId: string): Promise<void>

  abstract onCreateModelCard(req: Request, model: ModelDoc, modelCard: ModelCardInterface): Promise<void>
  abstract onViewModelCard(req: Request, modelId: string, modelCard: ModelCardInterface): Promise<void>
  abstract onViewModelCardRevisions(req: Request, modelId: string, modelCards: ModelCardInterface[]): Promise<void>
  abstract onUpdateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface): Promise<void>

  abstract onCreateFile(req: Request, file: FileInterface): Promise<void>
  abstract onViewFile(req: Request, file: FileInterface): Promise<void>
  abstract onViewFiles(req: Request, modelId: string, files: FileInterface[]): Promise<void>
  abstract onUpdateFile(req: Request, modelId: string, fileId: string): Promise<void>
  abstract onDeleteFile(req: Request, modelId: string, fileId: string): Promise<void>

  abstract onCreateRelease(req: Request, release: ReleaseDoc): Promise<void>
  abstract onViewRelease(req: Request, release: ReleaseDoc): Promise<void>
  abstract onViewReleases(req: Request, releases: ReleaseDoc[]): Promise<void>
  abstract onUpdateRelease(req: Request, release: ReleaseDoc): Promise<void>
  abstract onDeleteRelease(req: Request, modelId: string, semver: string): Promise<void>

  abstract onCreateCommentResponse(req: Request, response: ResponseInterface): Promise<void>
  abstract onCreateReviewResponse(req: Request, response: ResponseInterface): Promise<void>
  abstract onViewResponses(req: Request, responseInterfaces: ResponseInterface[]): Promise<void>
  abstract onUpdateResponse(req: Request, responseId: string): Promise<void>

  abstract onCreateUserToken(req: Request, token: TokenDoc): Promise<void>
  abstract onViewUserTokens(req: Request, tokens: TokenDoc[]): Promise<void>
  abstract onDeleteUserToken(req: Request, accessKey: string): Promise<void>

  abstract onCreateAccessRequest(req: Request, accessRequest: AccessRequestDoc): Promise<void>
  abstract onViewAccessRequest(req: Request, accessRequest: AccessRequestDoc): Promise<void>
  abstract onViewAccessRequests(req: Request, accessRequests: AccessRequestDoc[]): Promise<void>
  abstract onUpdateAccessRequest(req: Request, accessRequest: AccessRequestDoc): Promise<void>
  abstract onDeleteAccessRequest(req: Request, accessRequestId: string): Promise<void>

  abstract onSearchReviews(req: Request, reviews: (ReviewInterface & { model: ModelInterface })[]): Promise<void>

  abstract onCreateSchema(req: Request, schema: SchemaInterface): Promise<void>
  abstract onViewSchema(req: Request, schema: SchemaInterface): Promise<void>
  abstract onSearchSchemas(req: Request, schemas: SchemaInterface[]): Promise<void>
  abstract onUpdateSchema(req: Request, schema: SchemaDoc): Promise<void>
  abstract onDeleteSchema(req: Request, schemaId: string): Promise<void>

  abstract onCreateSchemaMigration(req: Request, schemaMigration: SchemaMigrationInterface): Promise<void>
  abstract onViewSchemaMigration(req: Request, schemaMigration: SchemaMigrationInterface): Promise<void>
  abstract onViewSchemaMigrations(req: Request, schemaMigrations: SchemaMigrationInterface[]): Promise<void>
  abstract onUpdateSchemaMigration(req: Request, schemaMigration: SchemaMigrationInterface): Promise<void>

  abstract onCreateInference(req: Request, inference: InferenceDoc): Promise<void>
  abstract onViewInference(req: Request, inference: InferenceDoc): Promise<void>
  abstract onViewInferences(req: Request, inference: InferenceDoc[]): Promise<void>
  abstract onUpdateInference(req: Request, inference: InferenceDoc): Promise<void>
  abstract onDeleteInference(req: Request, inference: InferenceDoc): Promise<void>

  abstract onViewModelImages(
    req: Request,
    modelId: string,
    images: { repository: string; name: string; tags: string[] }[],
  ): Promise<void>
  abstract onDeleteImage(req: Request, modelId: string, image: ImageRefInterface): Promise<void>

  abstract onCreateS3Export(req: Request, modelId: string, semvers?: string[]): Promise<void>
  abstract onCreateImport(
    req: Request,
    mirroredModel: ModelInterface,
    sourceModelId: string,
    exporter: string,
    importResult: Omit<MirrorInformation, 'metadata'>,
  ): Promise<void>

  abstract onCreateReviewRole(req: Request, reviewRole: ReviewRoleInterface): Promise<void>
  abstract onViewReviewRoles(req: Request, reviewRole: ReviewRoleInterface[]): Promise<void>
  abstract onUpdateReviewRole(req: Request, reviewRole: ReviewRoleInterface): Promise<void>
  abstract onDeleteReviewRole(req: Request, reviewRoleId: string): Promise<void>

  abstract onError(req: Request, error: BailoError): Promise<void>

  checkEventType(auditInfo: AuditInfoKeys, req: Request) {
    if (auditInfo.typeId !== req.audit.typeId && auditInfo.description !== req.audit.description) {
      throw new Error(`Audit: Expected type '${JSON.stringify(auditInfo)}' but received '${JSON.stringify(req.audit)}'`)
    }
  }
}
