import { Request } from 'express'

import { AccessRequestDoc } from '../../models/AccessRequest.js'
import { FileInterface, FileInterfaceDoc } from '../../models/File.js'
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
import { BaseAuditConnector } from './Base.js'

export class SillyAuditConnector extends BaseAuditConnector {
  constructor() {
    super()
  }

  async onCreateModel(_req: Request, _model: ModelDoc) {}
  async onViewModel(_req: Request, _model: ModelDoc) {}
  async onSearchModel(_req: Request, _models: EntrySearchResult[]) {}
  async onUpdateModel(_req: Request, _model: ModelDoc) {}
  async onDeleteModel(_req: Request, _modelId: string) {}
  async onCreateModelCard(_req: Request, _model: ModelDoc, _modelCard: ModelCardInterface) {}
  async onViewModelCard(_req: Request, _modelId: string, _modelCard: ModelCardInterface) {}
  async onViewModelCardRevisions(_req: Request, _modelId: string, _modelCards: ModelCardInterface[]) {}
  async onUpdateModelCard(_req: Request, _modelId: string, _modelCard: ModelCardInterface) {}
  async onCreateFile(_req: Request, _file: FileInterfaceDoc) {}
  async onViewFile(_req: Request, _file: FileInterfaceDoc) {}
  async onViewFiles(_req: Request, _modelId: string, _files: FileInterface[]) {}
  async onUpdateFile(_req: Request, _modelId: string, _fileId: string) {}
  async onDeleteFile(_req: Request, _modelId: string, _fileId: string) {}
  async onCreateRelease(_req: Request, _release: ReleaseDoc) {}
  async onViewRelease(_req: Request, _release: ReleaseDoc) {}
  async onViewReleases(_req: Request, _releases: ReleaseDoc[]) {}
  async onUpdateRelease(_req: Request, _release: ReleaseDoc) {}
  async onDeleteRelease(_req: Request, _modelId: string, _semver: string) {}
  async onCreateReviewResponse(_req: Request, _response: ResponseInterface) {}
  async onCreateCommentResponse(_req: Request, _responseInterface: ResponseInterface) {}
  async onViewResponses(_req: Request, _responseInters: ResponseInterface[]) {}
  async onUpdateResponse(_req: Request, _responseId: string) {}
  async onCreateUserToken(_req: Request, _token: TokenDoc) {}
  async onViewUserTokens(_req: Request, _tokens: TokenDoc[]) {}
  async onDeleteUserToken(_req: Request, _accessKey: string) {}
  async onCreateAccessRequest(_req: Request, _accessRequest: AccessRequestDoc) {}
  async onViewAccessRequest(_req: Request, _accessRequest: AccessRequestDoc) {}
  async onViewAccessRequests(_req: Request, _accessRequests: AccessRequestDoc[]) {}
  async onUpdateAccessRequest(_req: Request, _accessRequest: AccessRequestDoc) {}
  async onDeleteAccessRequest(_req: Request, _accessRequestId: string) {}
  async onSearchReviews(_req: Request, _reviews: (ReviewInterface & { model: ModelInterface })[]) {}
  async onCreateSchema(_req: Request, _schema: SchemaInterface) {}
  async onViewSchema(_req: Request, _schema: SchemaInterface) {}
  async onSearchSchemas(_req: Request, _schemas: SchemaInterface[]) {}
  async onUpdateSchema(_req: Request, _schema: SchemaDoc) {}
  async onDeleteSchema(_req: Request, _schemaId: string) {}
  async onCreateSchemaMigration(_req: Request, _schemaMigration: SchemaMigrationInterface) {}
  async onViewSchemaMigration(_req: Request, _schemaMigration: SchemaMigrationInterface) {}
  async onViewSchemaMigrations(_req: Request, _schemaMigrations: SchemaMigrationInterface[]) {}
  async onUpdateSchemaMigration(_req: Request, _schemaMigration: SchemaMigrationInterface) {}
  async onCreateInference(_req: Request, _inferences: InferenceDoc) {}
  async onViewInference(_req: Request, _inferences: InferenceDoc) {}
  async onViewInferences(_req: Request, _inferences: InferenceDoc[]) {}
  async onUpdateInference(_req: Request, _inferences: InferenceDoc) {}
  async onDeleteInference(_req: Request, _inferences: InferenceDoc) {}
  async onViewModelImages(
    _req: Request,
    _modelId: string,
    _images: { repository: string; name: string; tags: string[] }[],
  ) {}
  async onDeleteImage(_req: Request, _modelId: string, _image: ImageRefInterface) {}
  async onCreateS3Export(_req: Request, _modelId: string, _semvers?: string[]) {}
  async onCreateImport(
    _req: Request,
    _mirroredModel: ModelInterface,
    _sourceModelId: string,
    _exporter: string,
    _importResult: MirrorInformation,
  ) {}
  async onCreateReviewRole(_req: Request, _reviewRole: ReviewRoleInterface) {}
  async onViewReviewRoles(_req: Request) {}
  async onUpdateReviewRole(_req: Request, _reviewRole: ReviewRoleInterface) {}
  async onDeleteReviewRole(_req: Request, _reviewRoleId: string) {}
  async onError(_req: Request, _error: BailoError) {}
}
