import { Request } from 'express'

import { AccessRequestDoc } from '../../models/AccessRequest.js'
import { FileInterface, FileWithScanResultsInterface } from '../../models/File.js'
import { InferenceDoc } from '../../models/Inference.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../models/Model.js'
import { ImageTagRef, ReleaseDoc } from '../../models/Release.js'
import { ResponseInterface } from '../../models/Response.js'
import { ReviewInterface } from '../../models/Review.js'
import { ReviewRoleInterface } from '../../models/ReviewRole.js'
import { SchemaDoc, SchemaInterface } from '../../models/Schema.js'
import { SchemaMigrationInterface } from '../../models/SchemaMigration.js'
import { TokenDoc } from '../../models/Token.js'
import { BailoError } from '../../types/error.js'
import { EntrySearchResult, MirrorInformation, ModelImages } from '../../types/types.js'

export const AuditKind = {
  Create: 'Create',
  View: 'View',
  Update: 'Update',
  Delete: 'Delete',
  Search: 'Search',
  Download: 'Download',
  CreateImport: 'Import',
} as const
export type AuditKindKeys = (typeof AuditKind)[keyof typeof AuditKind]

export const ResourceKind = {
  Model: 'model',
  ModelCard: 'model card',
  File: 'file',
  Release: 'release',
  Token: 'token',
  AccessRequest: 'access request',
  Review: 'review',
  Response: 'response',
  ReviewResponse: 'review response',
  Schema: 'schema',
  SchemaMigration: 'schemaMigration',
  Image: 'image',
  Inference: 'inference',
  Export: 'export',
  ArtefactScanning: 'artefact scanning',
}
export type ResourceKindKeys = (typeof ResourceKind)[keyof typeof ResourceKind]

export const AuditInfo = {
  CreateModel: {
    typeId: 'CreateModel',
    description: 'Model Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.Model,
  },
  ViewModel: {
    typeId: 'ViewModel',
    description: 'Model Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Model,
  },
  UpdateModel: {
    typeId: 'UpdateModel',
    description: 'Model Updated',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.Model,
  },
  DeleteModel: {
    typeId: 'DeleteModel',
    description: 'Model Deleted',
    auditKind: AuditKind.Delete,
    resourceKind: ResourceKind.Model,
  },
  SearchModels: {
    typeId: 'SearchModels',
    description: 'Model Searched',
    auditKind: AuditKind.Search,
    resourceKind: ResourceKind.Model,
  },

  CreateModelCard: {
    typeId: 'CreateModelCard',
    description: 'Model Card Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.ModelCard,
  },
  ViewModelCard: {
    typeId: 'ViewModelCard',
    description: 'Model Card Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.ModelCard,
  },
  ViewModelCardRevisions: {
    typeId: 'ViewModelCardRevisions',
    description: 'Model Card Revisions Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.ModelCard,
  },
  UpdateModelCard: {
    typeId: 'UpdateModelCard',
    description: 'Model Card Updated',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.ModelCard,
  },

  CreateFile: {
    typeId: 'CreateFile',
    description: 'File Information Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.File,
  },
  DownloadFile: {
    typeId: 'DownloadFile',
    description: 'File downloaded',
    auditKind: AuditKind.Download,
    resourceKind: ResourceKind.File,
  },
  ViewFile: {
    typeId: 'ViewFile',
    description: 'File Downloaded',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.File,
  },
  ViewFiles: {
    typeId: 'ViewFiles',
    description: 'File Information Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.File,
  },
  DeleteFile: {
    typeId: 'DeleteFile',
    description: 'File Information Deleted',
    auditKind: AuditKind.Delete,
    resourceKind: ResourceKind.File,
  },
  UpdateFile: {
    typeId: 'UpdateFile',
    description: 'File Information Updated',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.File,
  },

  CreateRelease: {
    typeId: 'CreateRelease',
    description: 'Release Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.Release,
  },
  ViewRelease: {
    typeId: 'ViewRelease',
    description: 'Release Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Release,
  },
  UpdateRelease: {
    typeId: 'UpdateRelease',
    description: 'Release Updated',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.Release,
  },
  DeleteRelease: {
    typeId: 'DeleteRelease',
    description: 'Release Deleted',
    auditKind: AuditKind.Delete,
    resourceKind: ResourceKind.Release,
  },
  ViewReleases: {
    typeId: 'ViewReleases',
    description: 'Releases Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Release,
  },

  CreateUserToken: {
    typeId: 'CreateUserToken',
    description: 'Token Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.Release,
  },
  ViewUserTokens: {
    typeId: 'ViewUserToken',
    description: 'Token Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Release,
  },
  DeleteUserToken: {
    typeId: 'DeleteUserToken',
    description: 'Token Deleted',
    auditKind: AuditKind.Delete,
    resourceKind: ResourceKind.Release,
  },

  CreateAccessRequest: {
    typeId: 'CreateAccessRequest',
    description: 'Access Request Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.AccessRequest,
  },
  ViewAccessRequest: {
    typeId: 'ViewAccessRequest',
    description: 'Access Request Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.AccessRequest,
  },
  UpdateAccessRequest: {
    typeId: 'UpdateAccess Request',
    description: 'Access Request Updated',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.AccessRequest,
  },
  DeleteAccessRequest: {
    typeId: 'UpdateAccessRequest',
    description: 'Access Request Deleted',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.AccessRequest,
  },
  ViewAccessRequests: {
    typeId: 'ViewAccessRequests',
    description: 'Access Requests Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.AccessRequest,
  },

  SearchReviews: {
    typeId: 'SearchReviews',
    description: 'Reviews Searched',
    auditKind: AuditKind.Search,
    resourceKind: ResourceKind.Review,
  },
  CreateReviewResponse: {
    typeId: 'CreateReviewResponse',
    description: 'Review Response Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.ReviewResponse,
  },
  UpdateReviewResponse: {
    typeId: 'UpdateReviewResponse',
    description: 'Review Response Updated',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.ReviewResponse,
  },

  CreateSchema: {
    typeId: 'CreateSchema',
    description: 'Schema Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.Schema,
  },
  SearchSchemas: {
    typeId: 'SearchedSchemas',
    description: 'Schemas Searched',
    auditKind: AuditKind.Search,
    resourceKind: ResourceKind.Schema,
  },
  ViewSchema: {
    typeId: 'ViewSchema',
    description: 'Schema Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Schema,
  },
  DeleteSchema: {
    typeId: 'DeleteSchema',
    description: 'Schema Deleted',
    auditKind: AuditKind.Delete,
    resourceKind: ResourceKind.Schema,
  },
  UpdateSchema: {
    typeId: 'UpdateSchema',
    description: 'Schema Updated',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.Schema,
  },

  CreateSchemaMigration: {
    typeId: 'CreateSchemaMigration',
    description: 'Schema Migration Plan Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.SchemaMigration,
  },
  UpdateSchemaMigration: {
    typeId: 'UpdateSchemaMigration',
    description: 'Schema Migration Plan Updated',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.SchemaMigration,
  },
  ViewSchemaMigrations: {
    typeId: 'ViewSchemaMigrations',
    description: 'Schemas Migration Plans viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.SchemaMigration,
  },
  ViewSchemaMigration: {
    typeId: 'ViewSchemaMigration',
    description: 'Schema Migration Plan viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.SchemaMigration,
  },
  ViewModelImages: {
    typeId: 'ViewModelImages',
    description: 'Model Images Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Image,
  },
  ViewModelImage: {
    typeId: 'ViewModelImage',
    description: 'Model Image Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Image,
  },
  UpdateImage: {
    typeId: 'UpdateImage',
    description: 'Update Model Image',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.Image,
  },
  DeleteImage: {
    typeId: 'DeleteImage',
    description: 'Image Information Deleted',
    auditKind: AuditKind.Delete,
    resourceKind: ResourceKind.Image,
  },

  CreateInference: {
    typeId: 'CreateInference',
    description: 'Inference Service Created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.Inference,
  },
  UpdateInference: {
    typeId: 'UpdateInference',
    description: 'Inference Service Updated',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.Inference,
  },
  ViewInference: {
    typeId: 'ViewInference',
    description: 'Inference Service Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Inference,
  },
  ViewInferences: {
    typeId: 'ViewInferences',
    description: 'Inferences Viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Inference,
  },
  DeleteInference: {
    typeId: 'DeleteInferences',
    description: 'Inferences Deleted',
    auditKind: AuditKind.Delete,
    resourceKind: ResourceKind.Inference,
  },

  CreateExport: {
    typeId: 'CreateExport',
    description: 'Model Exported',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.Export,
  },
  CreateImport: {
    typeId: 'CreateImport',
    description: 'Model Imported',
    auditKind: AuditKind.CreateImport,
    resourceKind: ResourceKind.Export,
  },

  ViewResponses: {
    typeId: 'ViewResponses',
    description: 'View a list of responses',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Response,
  },
  CreateResponse: {
    typeId: 'CreateResponse',
    description: 'Review or comment responses created',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.Response,
  },
  UpdateResponse: {
    typeId: 'UpdateResponse',
    description: 'Updated a comment or review response',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.Response,
  },
  CreateReviewRole: {
    typeId: 'CreateReviewRole',
    description: 'Created a new review role',
    auditKind: AuditKind.Create,
    resourceKind: ResourceKind.Response,
  },
  UpdateReviewRole: {
    typeId: 'UpdateReviewRole',
    description: 'Updated an existing review role',
    auditKind: AuditKind.Update,
    resourceKind: ResourceKind.Response,
  },
  ViewReviewRoles: {
    typeId: 'ViewReviewRole',
    description: 'Viewed a list of review roles',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.Response,
  },
  DeleteReviewRole: {
    typeId: 'DeleteReviewRole',
    description: 'Delete a list of review roles',
    auditKind: AuditKind.Delete,
    resourceKind: ResourceKind.Response,
  },
  ViewScanners: {
    typeId: 'ViewScanners',
    description: 'Artefact scanners viewed',
    auditKind: AuditKind.View,
    resourceKind: ResourceKind.ArtefactScanning,
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
  abstract onDeleteFile(req: Request, file: FileWithScanResultsInterface): Promise<void>

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

  abstract onViewScanners(req: Request): Promise<void>

  abstract onViewModelImages(req: Request, modelId: string, images: ModelImages): Promise<void>
  abstract onViewModelImage(req: Request, modelId: string, name: string, tag: string): Promise<void>
  abstract onUpdateImage(req: Request, modelId: string, image: ImageTagRef): Promise<void>
  abstract onDeleteImage(req: Request, modelId: string, image: ImageTagRef): Promise<void>

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
