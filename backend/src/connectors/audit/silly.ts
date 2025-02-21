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
import { FileImportInformation, MongoDocumentImportInformation } from '../../services/mirroredModel.js'
import { BailoError } from '../../types/error.js'
import { BaseAuditConnector } from './Base.js'

export class SillyAuditConnector extends BaseAuditConnector {
  constructor() {
    super()
  }

  onCreateModel(_req: Request, _model: ModelDoc) {}
  onViewModel(_req: Request, _model: ModelDoc) {}
  onUpdateModel(_req: Request, _model: ModelDoc) {}
  onSearchModel(_req: Request, _models: ModelSearchResult[]) {}
  onCreateModelCard(_req: Request, _modelId: string, _modelCard: ModelCardInterface) {}
  onViewModelCard(_req: Request, _modelId: string, _modelCard: ModelCardInterface) {}
  onUpdateModelCard(_req: Request, _modelId: string, _modelCard: ModelCardInterface) {}
  onViewModelCardRevisions(_req: Request, _modelId: string, _modelCards: ModelCardInterface[]) {}
  onCreateFile(_req: Request, _file: FileInterfaceDoc) {}
  onViewFile(_req: Request, _file: FileInterfaceDoc) {}
  onViewFiles(_req: Request, _modelId: string, _files: FileInterface[]) {}
  onDeleteFile(_req: Request, _modelId: string, _fileId: string) {}
  onUpdateFile(_req: Request, _modelId: string, _fileId: string) {}
  onCreateRelease(_req: Request, _release: ReleaseDoc) {}
  onViewRelease(_req: Request, _release: ReleaseDoc) {}
  onUpdateRelease(_req: Request, _release: ReleaseDoc) {}
  onDeleteRelease(_req: Request, _modelId: string, _semver: string) {}
  onViewReleases(_req: Request, _releases: ReleaseDoc[]) {}
  onCreateUserToken(_req: Request, _token: TokenDoc) {}
  onViewUserTokens(_req: Request, _tokens: TokenDoc[]) {}
  onDeleteUserToken(_req: Request, _accessKey: string) {}
  onCreateAccessRequest(_req: Request, _accessRequest: AccessRequestDoc) {}
  onViewAccessRequest(_req: Request, _accessRequest: AccessRequestDoc) {}
  onUpdateAccessRequest(_req: Request, _accessRequest: AccessRequestDoc) {}
  onDeleteAccessRequest(_req: Request, _accessRequestId: string) {}
  onViewAccessRequests(_req: Request, _accessRequests: AccessRequestDoc[]) {}
  onSearchReviews(_req: Request, _reviews: (ReviewInterface & { model: ModelInterface })[]) {}
  onCreateReviewResponse(_req: Request, _response: ResponseInterface) {}
  onSearchSchemas(_req: Request, _schemas: SchemaInterface[]) {}
  onCreateSchema(_req: Request, _schema: SchemaInterface) {}
  onDeleteSchema(_req: Request, _schemaId: string) {}
  onUpdateSchema(_req: Request, _schema: SchemaDoc) {}
  onViewSchema(_req: Request, _schema: SchemaInterface) {}
  onViewModelImages(_req: Request, _modelId: string, _images: { repository: string; name: string; tags: string[] }[]) {}
  onViewInferences(_req: Request, _inferences: InferenceDoc[]) {}
  onViewInference(_req: Request, _inferences: InferenceDoc) {}
  onUpdateInference(_req: Request, _inferences: InferenceDoc) {}
  onCreateInference(_req: Request, _inferences: InferenceDoc) {}
  onCreateS3Export(_req: Request, _modelId: string, _semvers?: string[]) {}
  onCreateImport(
    _req: Request,
    _mirroredModel: ModelInterface,
    _sourceModelId: string,
    _exporter: string,
    _importResult: MongoDocumentImportInformation | FileImportInformation,
  ) {}
  onError(_req: Request, _error: BailoError) {}
  onCreateCommentResponse(_req: Request, _responseInterface: ResponseInterface) {}
  onViewResponses(_req: Request, _responseInters: ResponseInterface[]) {}
  onUpdateResponse(_req: Request, _responseId: string) {}
}
