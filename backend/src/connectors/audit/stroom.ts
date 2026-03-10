import { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import os from 'os'
import { ParsedQs } from 'qs'

import { AccessRequestDoc } from '../../models/AccessRequest.js'
import { FileInterface, FileInterfaceDoc, FileWithScanResultsInterface } from '../../models/File.js'
import { InferenceDoc } from '../../models/Inference.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../models/Model.js'
import { ImageRefInterface, ReleaseDoc } from '../../models/Release.js'
import { ResponseInterface } from '../../models/Response.js'
import { ReviewInterface } from '../../models/Review.js'
import { ReviewRoleInterface } from '../../models/ReviewRole.js'
import { SchemaInterface } from '../../models/Schema.js'
import { SchemaMigrationInterface } from '../../models/SchemaMigration.js'
import { StroomEventObject } from '../../models/StroomEvent.js'
import { TokenDoc } from '../../models/Token.js'
import log from '../../services/log.js'
import { MongoDocumentMirrorInformation } from '../../services/mirroredModel/importers/documents.js'
import { FileMirrorInformation } from '../../services/mirroredModel/importers/file.js'
import { ImageMirrorInformation } from '../../services/mirroredModel/importers/image.js'
import { processBatch, saveEvent } from '../../services/stroom.js'
import { BailoError } from '../../types/error.js'
import { EntrySearchResult, isFileMirrorInformation, isMongoDocumentMirrorInformation } from '../../types/types.js'
import config from '../../utils/config.js'
import { AuditKind, BaseAuditConnector } from './Base.js'

export type EventDetail = {
  TypeId: string
  Description?: string
} & EventDetailVariant

type EventDetailVariant =
  | {
      Create: EventObject | EventFile
    }
  | {
      Delete: EventObject | EventFile
    }
  | {
      View: EventObject | { Object: Array<ObjectInfo> } | { File: Array<FileInfo> } | { Object: { Id: null } }
    }
  | UpdateEventDetail
  | SearchEventDetail
  | ImportEventDetail
  | ExportEventDetail

type EventObject =
  | {
      Object: ObjectInfo
    }
  | ErrorEventInfo

type ObjectInfo = {
  Id: string
  Name: string
  Description: string
}

type ErrorEventInfo = {
  Object: {
    Name: string
  }
  Outcome: {
    Success: false
    Description: string
  }
}

type EventFile = {
  File: FileInfo
}

type FileInfo = {
  Id: string
  Name: string
  Description: string

  Path: string
  Created: Date
  Modified: Date
  Size: number
}

type UpdateEventDetail =
  | {
      Update: {
        After: {
          Object: {
            Name: string
          }
        }
      }
    }
  | UpdateErrorEventInfo

type UpdateErrorEventInfo = {
  After: {
    Object: {
      Name: string
    }
  }
  Outcome: {
    Success: false
    Description: string
  }
}

type SearchEventDetail = {
  TypeId: string
} & SearchEventVariant

type SearchEventVariant =
  | {
      Search: {
        Description: string
        Query: { Advanced: { And: { Term: Array<SearchTerm> } } } | { Raw: string }
        TotalResults: number
        Results?: SearchResult
      }
    }
  | {
      Search: {
        Description: string
        Query: { Advanced: { And: { Term: Array<SearchTerm> } } } | { Raw: string }
        Outcome: {
          Success: false
          Description: string
        }
      }
    }

type SearchResult = {
  SearchResult: Array<{ Id: string }>
}

type SearchTerm = { Name: string; Condition: string; Value: any }

type ExportEventDetail = {
  TypeId: string
  Export:
    | { Source: EventFile }
    | {
        Outcome: {
          Success: false
          Description: string
        }
      }
}

type ImportEventDetail = {
  TypeId: string
  Import:
    | {
        Source: {
          Object: {
            Id: string
            Description: string
          }
          User: {
            Id: string
            Description: string
          }
        }
        Destination: {
          Object: {
            Id: string
            Description: string
          }
        }
        Data: Array<{ '@Name': string; '@Value': string }>
      }
    | {
        Outcome: {
          Success: false
          Description: string
        }
      }
}

export class StroomAuditConnector extends BaseAuditConnector {
  hostIP: string

  constructor() {
    super()
    this.hostIP = this.getHostDeviceIP()[0] ?? '0.0.0.0'
    setInterval(() => {
      processBatch()
    }, config.stroom.interval)
  }

  getReadableFileId(file: FileInterface | FileInterfaceDoc) {
    return `${file.name} (${file._id.toString()})`
  }

  async onCreateModel(req: Request, model: ModelDoc) {
    this.auditGenericEvent(req, model.id)
  }

  async onViewModel(req: Request, model: ModelDoc) {
    this.auditGenericEvent(req, model.id)
  }

  async onSearchModel(req: Request, models: EntrySearchResult[]) {
    this.auditSearchEvent(
      req,
      models.map((model) => ({ Id: model.id })),
    )
  }

  async onUpdateModel(req: Request, model: ModelDoc) {
    this.auditGenericEvent(req, model.id)
  }

  async onDeleteModel(req: Request, modelId: string) {
    this.auditGenericEvent(req, modelId)
  }

  async onCreateModelCard(req: Request, model: ModelDoc, modelCard: ModelCardInterface) {
    this.auditGenericEvent(req, `${model.id}:${modelCard.version}`)
  }

  async onViewModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.auditGenericEvent(req, `${modelId}:${modelCard.version}`)
  }

  async onViewModelCardRevisions(req: Request, modelId: string, modelCards: ModelCardInterface[]) {
    this.auditMultipleViewEvent(
      req,
      modelCards.map((modelCard) => ({ Id: `${modelId}:${modelCard.version}` })),
      'model card revision',
    )
  }

  async onUpdateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.auditGenericEvent(req, `${modelId}:${modelCard.version}`)
  }

  async onCreateFile(req: Request, file: FileInterfaceDoc) {
    this.auditFileEvent(req, [file])
  }

  async onViewFile(req: Request, file: FileInterfaceDoc) {
    this.auditFileEvent(req, [file])
  }

  async onViewFiles(req: Request, modelId: string, files: FileInterface[]) {
    this.auditFileEvent(req, files)
  }

  async onUpdateFile(req: Request, modelId: string, fileId: string) {
    this.auditGenericEvent(req, `${modelId} - ${fileId}`)
  }

  async onDeleteFile(req: Request, file: FileWithScanResultsInterface) {
    this.auditFileEvent(req, [file])
  }

  async onCreateRelease(req: Request, release: ReleaseDoc) {
    this.auditGenericEvent(req, `${release.modelId}:${release.semver}`)
  }

  async onViewRelease(req: Request, release: ReleaseDoc) {
    this.auditGenericEvent(req, `${release.modelId}:${release.semver}`)
  }

  async onViewReleases(req: Request, releases: ReleaseDoc[]) {
    this.auditMultipleViewEvent(
      req,
      releases.map((release) => ({ Id: `${release.modelId}:${release.semver}` })),
      'release',
    )
  }

  async onUpdateRelease(req: Request, release: ReleaseDoc) {
    this.auditGenericEvent(req, `${release.modelId}:${release.semver}`)
  }

  async onDeleteRelease(req: Request, modelId: string, semver: string) {
    this.auditGenericEvent(req, `${modelId}:${semver}`)
  }

  async onCreateReviewResponse(req: Request, response: ResponseInterface) {
    this.auditGenericEvent(req, `${response._id}`)
  }

  async onCreateCommentResponse(req: Request, response: ResponseInterface) {
    this.auditGenericEvent(req, `${response._id}`)
  }

  async onViewResponses(req: Request, responses: ResponseInterface[]) {
    this.auditMultipleViewEvent(
      req,
      responses.map((response) => ({ Id: `${response._id}` })),
      req.audit.resourceKind,
    )
  }

  async onUpdateResponse(req: Request, responseId: string) {
    this.auditGenericEvent(req, responseId)
  }

  async onCreateUserToken(req: Request, token: TokenDoc) {
    this.auditGenericEvent(req, token.accessKey)
  }

  async onViewUserTokens(req: Request, tokens: TokenDoc[]) {
    this.auditMultipleViewEvent(
      req,
      tokens.map((token) => ({ Id: token.accessKey })),
      'token',
    )
  }

  async onDeleteUserToken(req: Request, accessKey: string) {
    this.auditGenericEvent(req, accessKey)
  }

  async onCreateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.auditGenericEvent(req, accessRequest.id)
  }

  async onViewAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.auditGenericEvent(req, accessRequest.id)
  }

  async onViewAccessRequests(req: Request, accessRequests: AccessRequestDoc[]) {
    this.auditMultipleViewEvent(
      req,
      accessRequests.map((accessRequest) => ({
        Id: accessRequest.id,
      })),
      'access Request',
    )
  }

  async onUpdateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.auditGenericEvent(req, accessRequest.id)
  }

  async onDeleteAccessRequest(req: Request, accessRequestId: string) {
    this.auditGenericEvent(req, accessRequestId)
  }

  async onSearchReviews(req: Request, reviews: (ReviewInterface & { model: ModelInterface })[]) {
    this.auditSearchEvent(
      req,
      reviews.map((review) => ({ Id: `${review.modelId}:${review.semver ? review.semver : review.accessRequestId}` })),
    )
  }

  async onCreateSchema(req: Request, schema: SchemaInterface) {
    this.auditGenericEvent(req, schema.id)
  }

  async onViewSchema(req: Request, schema: SchemaInterface) {
    this.auditGenericEvent(req, schema.id)
  }

  async onSearchSchemas(req: Request, schemas: SchemaInterface[]) {
    this.auditSearchEvent(
      req,
      schemas.map((schema) => ({ Id: `${schema.id}` })),
    )
  }

  async onUpdateSchema(req: Request, schema: SchemaInterface) {
    this.auditGenericEvent(req, schema.id)
  }

  async onDeleteSchema(req: Request, schemaId: string) {
    this.auditGenericEvent(req, schemaId)
  }

  async onCreateSchemaMigration(req: Request, schemaMigration: SchemaMigrationInterface) {
    this.auditGenericEvent(req, schemaMigration.id)
  }

  async onViewSchemaMigration(req: Request, schemaMigration: SchemaMigrationInterface) {
    this.auditGenericEvent(req, schemaMigration.id)
  }

  async onViewSchemaMigrations(req: Request, schemaMigrations: SchemaMigrationInterface[]) {
    this.auditMultipleViewEvent(
      req,
      schemaMigrations.map((schemaMigration) => ({ Id: schemaMigration.id })),
      'schema migration',
    )
  }

  async onUpdateSchemaMigration(req: Request, schemaMigration: SchemaMigrationInterface) {
    this.auditGenericEvent(req, schemaMigration.id)
  }

  async onCreateInference(req: Request, inference: InferenceDoc) {
    this.auditGenericEvent(req, `${inference.modelId}/${inference.image}:${inference.tag}`)
  }

  async onViewInference(req: Request, inference: InferenceDoc) {
    this.auditGenericEvent(req, `${inference.modelId}/${inference.image}:${inference.tag}`)
  }

  async onViewInferences(req: Request, inferences: InferenceDoc[]) {
    this.auditMultipleViewEvent(
      req,
      inferences.map((inference) => ({ Id: `${inference.modelId}/${inference.image}:${inference.tag}` })),
      'inference',
    )
  }

  async onUpdateInference(req: Request, inference: InferenceDoc) {
    this.auditGenericEvent(req, `${inference.modelId}/${inference.image}:${inference.tag}`)
  }

  async onDeleteInference(req: Request, inference: InferenceDoc) {
    this.auditGenericEvent(req, `${inference.modelId}/${inference.image}:${inference.tag}`)
  }

  async onViewModelImages(
    req: Request,
    modelId: string,
    images: { repository: string; name: string; tags: string[] }[],
  ) {
    this.auditMultipleViewEvent(
      req,
      images.map((image) => ({ Id: `${image.repository}/${image.name}:${image.tags}` })),
      'docker image',
    )
  }

  async onDeleteImage(req: Request, modelId: string, image: ImageRefInterface) {
    this.auditGenericEvent(req, `${image.repository}/${image.name}:${image.tag}`)
  }

  async onCreateS3Export(
    req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    modelId: string,
    semvers?: string[] | undefined,
  ) {
    this.auditGenericEvent(req, `${modelId} - ${semvers?.join(', ') ?? 'all'}`)
  }

  async onCreateImport(
    req: Request,
    mirroredModel: ModelInterface,
    sourceModelId: string,
    exporter: string,
    importResult: MongoDocumentMirrorInformation | FileMirrorInformation | ImageMirrorInformation,
  ) {
    this.auditImportEvent(req, sourceModelId, exporter, mirroredModel.id, { ...importResult })
  }

  async onCreateReviewRole(req: Request, reviewRole: ReviewRoleInterface) {
    this.auditGenericEvent(req, `Review role created for ${reviewRole.name}`)
  }

  async onViewReviewRoles(req: Request, reviewRole: ReviewRoleInterface[]) {
    this.auditGenericEvent(req, `${reviewRole.length} review roles found.`)
  }

  async onUpdateReviewRole(req: Request, reviewRole: ReviewRoleInterface) {
    this.auditGenericEvent(req, reviewRole.name)
  }

  async onDeleteReviewRole(req: Request, reviewRoleId: string) {
    this.auditGenericEvent(req, reviewRoleId)
  }

  async onError(req: Request, error: BailoError) {
    if (!req.audit) {
      log.warn({ url: req.url }, 'Unable to audit')
      return
    }
    const eventInfo: ErrorEventInfo = {
      Object: { Name: req.audit.resourceKind },
      Outcome: { Success: false, Description: `${error.message} - ${JSON.stringify(error.context)}` },
    }
    const updateEventInfo: UpdateErrorEventInfo = {
      After: {
        Object: eventInfo.Object,
      },
      Outcome: eventInfo.Outcome,
    }
    let eventDetail: EventDetail
    switch (req.audit.auditKind) {
      case AuditKind.Create:
        eventDetail = { TypeId: req.audit.typeId, Create: eventInfo }
        break
      case AuditKind.View:
        eventDetail = { TypeId: req.audit.typeId, View: eventInfo }
        break
      case AuditKind.Delete:
        eventDetail = { TypeId: req.audit.typeId, Delete: eventInfo }
        break
      case AuditKind.Update:
        eventDetail = { TypeId: req.audit.typeId, Update: updateEventInfo }
        break
      case AuditKind.Search: {
        eventDetail = {
          TypeId: req.audit.typeId,
          Search: {
            ...this.getSearchDescriptionAndQuery(req),
            Outcome: { Success: false, Description: `${error.message} - ${JSON.stringify(error.context)}` },
          },
        }
        break
      }
      case AuditKind.Download: {
        eventDetail = {
          TypeId: req.audit.typeId,
          Export: {
            Outcome: { Success: false, Description: `${error.message} - ${JSON.stringify(error.context)}` },
          },
        }
        break
      }
      case AuditKind.CreateImport: {
        eventDetail = {
          TypeId: req.audit.typeId,
          Import: {
            Outcome: { Success: false, Description: `${error.message} - ${JSON.stringify(error.context)}` },
          },
        }
        break
      }
      default:
        throw Error('Unable to create Event Detail for an error event.')
    }
    this.generateEvent(req, eventDetail)
  }

  async generateEvent(req: Request, eventDetail: EventDetail) {
    const event: StroomEventObject = {
      EventTime: { TimeCreated: new Date().toISOString() },
      EventSource: {
        System: { Name: 'bailo', Environment: config.stroom.environment },
        Generator: config.stroom.generator,
        Device: { IPAddress: this.hostIP },
        User: { Id: req.user.dn },
      },
      EventDetail: eventDetail,
    }
    if (config.stroom.enabled) {
      await saveEvent(event)
    } else {
      log.info(
        { stroomConfig: config.stroom, event },
        'STROOM is not enabled. The audit event will not be saved and sent to STROOM',
      )
    }
  }

  auditGenericEvent(req: Request, Id: string) {
    const eventInfo: EventObject = {
      Object: {
        Id,
        Name: req.audit.resourceKind,
        Description: req.audit.description,
      },
    }
    let eventDetail: EventDetail
    switch (req.audit.auditKind) {
      case AuditKind.Create:
        eventDetail = { TypeId: req.audit.typeId, Create: eventInfo }
        break
      case AuditKind.View:
        eventDetail = { TypeId: req.audit.typeId, View: eventInfo }
        break
      case AuditKind.Delete:
        eventDetail = { TypeId: req.audit.typeId, Delete: eventInfo }
        break
      case AuditKind.Update:
        eventDetail = { TypeId: req.audit.typeId, Update: { After: eventInfo } }
        break
      case AuditKind.Download:
        throw Error('Incorrect method called for a Download Event.')
      case AuditKind.Search: {
        throw Error('Incorrect method called for a Search Event.')
      }
      default:
        throw Error('Unable to create Event Detail')
    }
    this.generateEvent(req, eventDetail)
  }

  auditFileEvent(req: Request, files: FileInterfaceDoc[] | FileInterface[]) {
    let eventDetail: EventDetail
    switch (req.audit.auditKind) {
      case AuditKind.Create: {
        const file = files.at(0)
        if (!file) {
          throw Error('Missing file')
        }
        eventDetail = {
          TypeId: req.audit.typeId,
          Create: {
            File: {
              Id: this.getReadableFileId(file),
              Name: req.audit.resourceKind,
              Description: req.audit.description,
              Path: `${config.s3.buckets.uploads}/${file.path}`,
              Created: file.createdAt,
              Modified: file.updatedAt,
              Size: file.size,
            },
          },
        }
        break
      }
      case AuditKind.Delete: {
        const file = files.at(0)
        if (!file) {
          throw Error('Missing file')
        }
        eventDetail = {
          TypeId: req.audit.typeId,
          Delete: {
            File: {
              Id: this.getReadableFileId(file),
              Name: req.audit.resourceKind,
              Description: req.audit.description,
              Path: `${config.s3.buckets.uploads}/${file.path}`,
              Created: file.createdAt,
              Modified: file.updatedAt,
              Size: file.size,
            },
          },
        }
        break
      }
      case AuditKind.View: {
        const infos = files.map((file) => ({
          Id: this.getReadableFileId(file),
          Name: req.audit.resourceKind,
          Description: req.audit.description,
          Path: `${config.s3.buckets.uploads}/${file.path}`,
          Created: file.createdAt,
          Modified: file.updatedAt,
          Size: file.size,
        }))
        eventDetail = { TypeId: req.audit.typeId, View: { File: infos } }
        break
      }
      case AuditKind.Download: {
        const file = files.at(0)
        if (!file) {
          throw Error('Missing file')
        }
        eventDetail = {
          TypeId: req.audit.typeId,
          Export: {
            Source: {
              File: {
                Id: this.getReadableFileId(file),
                Name: req.audit.resourceKind,
                Description: req.audit.description,
                Path: `${config.s3.buckets.uploads}/${file.path}`,
                Created: file.createdAt,
                Modified: file.updatedAt,
                Size: file.size,
              },
            },
          },
        }
        break
      }
      default:
        throw Error('Unable to create Event Detail`')
    }
    this.generateEvent(req, eventDetail)
  }

  auditMultipleViewEvent(req: Request, ids: Array<{ Id: string }>, name: string) {
    if (req.audit.auditKind !== AuditKind.View) {
      throw Error(`View Multiple Event method incorrectly called for ${req.audit.auditKind} Event`)
    }
    if (ids.length === 0) {
      return this.generateEvent(req, {
        TypeId: req.audit.typeId,
        Description: 'No items viewed',
        View: { Object: { Id: null } },
      })
    }
    const infos = ids.map((info) => ({
      Id: info.Id,
      Name: name,
      Description: req.audit.description,
    }))
    this.generateEvent(req, { TypeId: req.audit.typeId, View: { Object: infos } })
  }

  auditSearchEvent(req: Request, ids: Array<{ Id: string }>) {
    const eventDetail: SearchEventDetail = {
      TypeId: req.audit.typeId,
      Search: {
        ...this.getSearchDescriptionAndQuery(req),
        TotalResults: ids.length,
        ...(ids.length > 0 && {
          Results: { SearchResult: ids },
        }),
      },
    }
    this.generateEvent(req, eventDetail)
  }

  getSearchDescriptionAndQuery(req: Request) {
    if (req.audit.auditKind !== AuditKind.Search) {
      throw Error(`Search Event method incorrectly called for ${req.audit.auditKind} Event`)
    }
    const searchTerms: SearchTerm[] = []
    for (const query in req.query) {
      if (req.query[query]) {
        const requestQuery = req.query[query]
        if (Array.isArray(requestQuery)) {
          requestQuery.map((q) => {
            searchTerms.push({
              Name: query,
              Condition: 'Contains',
              Value: q,
            })
          })
        } else {
          searchTerms.push({
            Name: query,
            Condition: 'Equals',
            Value: req.query[query],
          })
        }
      }
    }

    if (searchTerms.length > 0) {
      return {
        Description: req.audit.description,
        Query: {
          Advanced: { And: { Term: searchTerms } },
        },
      }
    } else {
      return {
        Description: req.audit.description,
        Query: {
          Raw: `All ${req.audit.resourceKind}s`,
        },
      }
    }
  }

  auditImportEvent(
    req: Request,
    sourceId: string,
    exporter: string,
    mirroredModelId: string,
    importResult: MongoDocumentMirrorInformation | FileMirrorInformation | ImageMirrorInformation,
  ) {
    const eventDetail: ImportEventDetail = {
      TypeId: req.audit.typeId,
      Import: {
        Source: {
          Object: { Id: sourceId, Description: 'Model from Bailo LS.' },
          User: { Id: exporter, Description: 'User on Bailo LS.' },
        },
        Destination: {
          Object: { Id: mirroredModelId, Description: 'Mirrored model on Bailo HS.' },
        },
        Data: isMongoDocumentMirrorInformation(importResult)
          ? [
              {
                '@Name': 'Model card versions',
                '@Value': importResult.modelCardVersions.toString(),
              },
              {
                '@Name': 'Release semvers',
                '@Value': importResult.releaseSemvers.toString(),
              },
              {
                '@Name': 'File IDs',
                '@Value': importResult.fileIds.toString(),
              },
            ]
          : isFileMirrorInformation(importResult)
            ? [
                {
                  '@Name': 'File paths',
                  '@Value': importResult.newPath.toString(),
                },
              ]
            : [
                {
                  '@Name': 'Image Name',
                  '@Value': importResult.image.imageName.toString(),
                },
                {
                  '@Name': 'Image Tag',
                  '@Value': importResult.image.imageTag.toString(),
                },
              ],
      },
    }
    this.generateEvent(req, eventDetail)
  }

  getHostDeviceIP() {
    const addresses: string[] = []
    const interfaces = os.networkInterfaces()
    for (const k in interfaces) {
      const int = interfaces[k]
      if (!int) {
        continue
      }
      for (const k2 in int) {
        const address = int[k2]
        if (address.family === 'IPv4' && !address.internal) {
          addresses.push(address.address)
        }
      }
    }
    return addresses
  }
}
