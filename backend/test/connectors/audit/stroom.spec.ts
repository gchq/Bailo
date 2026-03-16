import { Request } from 'express'
import { describe, expect, test, vi } from 'vitest'

import { StroomAuditConnector } from '../../../src/connectors/audit/stroom.js'
import { AccessRequestDoc } from '../../../src/models/AccessRequest.js'
import { FileInterfaceDoc, FileWithScanResultsInterface } from '../../../src/models/File.js'
import { InferenceDoc } from '../../../src/models/Inference.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../../src/models/Model.js'
import { ImageRefInterface, ReleaseDoc } from '../../../src/models/Release.js'
import { ResponseInterface } from '../../../src/models/Response.js'
import { ReviewInterface } from '../../../src/models/Review.js'
import { ReviewRoleInterface } from '../../../src/models/ReviewRole.js'
import { SchemaInterface } from '../../../src/models/Schema.js'
import { SchemaMigrationInterface } from '../../../src/models/SchemaMigration.js'
import { TokenDoc } from '../../../src/models/Token.js'
import { MongoDocumentMirrorInformation } from '../../../src/services/mirroredModel/importers/documents.js'
import { FileMirrorInformation } from '../../../src/services/mirroredModel/importers/file.js'
import { ImageMirrorInformation } from '../../../src/services/mirroredModel/importers/image.js'
import { InternalError } from '../../../src/utils/error.js'

const configMock = vi.hoisted(() => ({
  connectors: {
    audit: {
      kind: 'stroom',
    },
  },
  stroom: {
    enabled: true,
    feed: 'feed',
    url: 'https://url',
    environment: 'local',
    interval: 1000 * 50,
    generator: 'Generator',
  },
  s3: {
    buckets: {
      uploads: 'uploads',
      registry: 'registry',
    },
  },
}))
vi.mock('../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../../src/services/log.js', async () => ({
  default: logMock,
}))

const mockStroomService = vi.hoisted(() => ({
  saveEvent: vi.fn(),
}))
vi.mock('../../../src/services/stroom.js', () => mockStroomService)

const osMock = vi.hoisted(() => ({
  networkInterfaces: vi.fn(() => ({
    lo: [
      {
        address: '127.0.0.1',
        family: 'IPv4',
        internal: false,
      },
    ],
  })),
}))
vi.mock('os', async () => ({ default: osMock }))

describe('connectors > audit > stroom', () => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
  const connector = new StroomAuditConnector()
  const request = {
    headers: { 'x-forwarded-for': 'ip' } as unknown,
    socket: { remoteAddress: '1.2.3' },
    user: {
      dn: 'test-dn',
    },
    audit: {
      typeId: 'TestType',
      auditKind: 'Create',
      resourceKind: 'testKind',
      description: 'test description',
    },
  }

  const createEventRequest = {
    ...request,
    audit: {
      ...request.audit,
      auditKind: 'Create',
    },
  } as Request

  const viewEventRequest = {
    ...request,
    audit: {
      ...request.audit,
      auditKind: 'View',
    },
  } as Request

  const updateEventRequest = {
    ...request,
    audit: {
      ...request.audit,
      auditKind: 'Update',
    },
  } as Request

  const deleteEventRequest = {
    ...request,
    audit: {
      ...request.audit,
      auditKind: 'Delete',
    },
  } as Request

  const searchEventRequest = {
    ...request,
    audit: {
      ...request.audit,
      auditKind: 'Search',
    },
  } as Request

  test('create connector > host IP is populated', async () => {
    const auditConnector = new StroomAuditConnector()
    expect(auditConnector.hostIP)
  })

  test('onCreateModel > save expected event', async () => {
    await connector.onCreateModel(createEventRequest, { id: 'test-model' } as ModelDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewModel > save expected event', async () => {
    await connector.onViewModel(createEventRequest, { id: 'test-model' } as ModelDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onSearchModel > save expected event', async () => {
    await connector.onSearchModel(searchEventRequest, [{ id: 'test-model' } as ModelInterface])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onUpdateModel > save expected event', async () => {
    await connector.onUpdateModel(createEventRequest, { id: 'test-model' } as ModelDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteModel > save expected event', async () => {
    await connector.onDeleteModel(deleteEventRequest, 'test-model')
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateModelCard > save expected event', async () => {
    await connector.onCreateModelCard(
      createEventRequest,
      { id: 'test-model' } as ModelDoc,
      { version: 1 } as ModelCardInterface,
    )
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewModelCard > save expected event', async () => {
    await connector.onViewModelCard(viewEventRequest, 'test-model', { version: 1 } as ModelCardInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewModelCardRevisions > save expected event', async () => {
    await connector.onViewModelCardRevisions(viewEventRequest, 'test-model', [{ version: 1 } as ModelCardInterface])
  })

  test('onUpdateModelCard > save expected event', async () => {
    await connector.onUpdateModelCard(updateEventRequest, 'test-model', { version: 1 } as ModelCardInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateFile > save expected event', async () => {
    await connector.onCreateFile(createEventRequest, {
      _id: 'test-file',
      name: 'myFile',
    } as unknown as FileInterfaceDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewFile > save expected event', async () => {
    await connector.onViewFile(viewEventRequest, {
      _id: 'test-file',
      name: 'myFile',
    } as unknown as FileInterfaceDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewFiles > save expected event', async () => {
    await connector.onViewFiles(viewEventRequest, 'model Id', [
      { _id: 'test-file', name: 'myFile' } as unknown as FileInterfaceDoc,
    ])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteFile > save expected event', async () => {
    await connector.onDeleteFile(deleteEventRequest, {
      _id: 'test-file',
      name: 'myFile',
    } as unknown as FileWithScanResultsInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateRelease > save expected event', async () => {
    await connector.onCreateRelease(createEventRequest, { modelId: 'model ID', semver: '1.2.3' } as ReleaseDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewRelease > save expected event', async () => {
    await connector.onViewRelease(viewEventRequest, { modelId: 'model ID', semver: '1.2.3' } as ReleaseDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewReleases > save expected event', async () => {
    await connector.onViewReleases(viewEventRequest, [{ modelId: 'model ID', semver: '1.2.3' } as ReleaseDoc])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onUpdateRelease > save expected event', async () => {
    await connector.onUpdateRelease(updateEventRequest, { modelId: 'model ID', semver: '1.2.3' } as ReleaseDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteRelease > save expected event', async () => {
    await connector.onDeleteRelease(deleteEventRequest, 'model ID', '1.2.3')
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateReviewResponse > save expected event', async () => {
    await connector.onCreateReviewResponse(createEventRequest, { _id: 'abc' as any } as ResponseInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateCommentResponse > save expected event', async () => {
    await connector.onCreateCommentResponse(createEventRequest, { _id: 'acb' as any } as ResponseInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewResponses > save expected event', async () => {
    await connector.onViewResponses(viewEventRequest, [{ _id: 'acb' as any } as ResponseInterface])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })
  test('onUpdateResponse > save expected event', async () => {
    await connector.onUpdateResponse(updateEventRequest, 'acb')
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateUserToken > save expected event', async () => {
    await connector.onCreateUserToken(createEventRequest, { accessKey: 'access' } as TokenDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewUserToken > save expected event', async () => {
    await connector.onViewUserTokens(viewEventRequest, [{ accessKey: 'access' } as TokenDoc])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteUserToken > save expected event', async () => {
    await connector.onDeleteUserToken(deleteEventRequest, 'access')
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateAccessRequest > save expected event', async () => {
    await connector.onCreateAccessRequest(createEventRequest, {
      id: 'id',
    } as AccessRequestDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewAccessRequest > save expected event', async () => {
    await connector.onViewAccessRequest(viewEventRequest, {
      id: 'id',
    } as AccessRequestDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewAccessRequests > save expected event', async () => {
    await connector.onViewAccessRequests(viewEventRequest, [
      {
        id: 'id',
      } as AccessRequestDoc,
    ])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onUpdateAccessRequest > save expected event', async () => {
    await connector.onUpdateAccessRequest(createEventRequest, {
      id: 'id',
    } as AccessRequestDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteAccessRequest > save expected event', async () => {
    await connector.onDeleteAccessRequest(deleteEventRequest, 'id')
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onSearchReviews > save expected event', async () => {
    await connector.onSearchReviews({ ...searchEventRequest, query: { test: 'query' } as unknown } as Request, [
      { modelId: ' abc', semver: '1.2.3' } as ReviewInterface & { model: ModelInterface },
    ])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateSchema > save expected event', async () => {
    await connector.onCreateSchema(createEventRequest, { id: 'id' } as SchemaInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewSchema > save expected event', async () => {
    await connector.onViewSchema(viewEventRequest, { id: 'id' } as SchemaInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onSearchSchemas > save expected event', async () => {
    await connector.onSearchSchemas(searchEventRequest, [{ id: 'id' } as SchemaInterface])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onUpdateSchema > save expected event', async () => {
    await connector.onUpdateSchema(updateEventRequest, { id: 'id' } as SchemaInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteSchema > save expected event', async () => {
    await connector.onDeleteSchema(deleteEventRequest, 'id')
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateSchemaMigration > save expected event', async () => {
    await connector.onCreateSchemaMigration(createEventRequest, { id: 'test-schema' } as SchemaMigrationInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewSchemaMigration > save expected event', async () => {
    await connector.onViewSchemaMigration(viewEventRequest, { id: 'test-schema' } as SchemaMigrationInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewSchemaMigrations > save expected event', async () => {
    await connector.onViewSchemaMigrations(viewEventRequest, [{ id: 'test-schema' } as SchemaMigrationInterface])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onUpdateSchemaMigration > save expected event', async () => {
    await connector.onUpdateSchemaMigration(updateEventRequest, { id: 'test-schema' } as SchemaMigrationInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateInference > save expected event', async () => {
    await connector.onCreateInference(createEventRequest, { id: 'id' } as InferenceDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewInference > save expected event', async () => {
    await connector.onViewInference(viewEventRequest, { id: 'id' } as InferenceDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewInferences > save expected event', async () => {
    await connector.onViewInferences(viewEventRequest, [{ id: 'id' } as InferenceDoc])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onUpdateInference > save expected event', async () => {
    await connector.onUpdateInference(updateEventRequest, { id: 'id' } as InferenceDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteInference > save expected event', async () => {
    await connector.onDeleteInference(deleteEventRequest, { id: 'id' } as InferenceDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewModelImages > save expected event', async () => {
    await connector.onViewModelImages(viewEventRequest, 'model id', [
      {
        repository: 'repo',
        name: 'name',
        tags: ['tag'],
      },
    ])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteImage > save expected event', async () => {
    await connector.onDeleteImage(deleteEventRequest, 'modelId', { tag: 'string' } as ImageRefInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateS3Export > save expected event', async () => {
    await connector.onCreateS3Export(createEventRequest, 'modelId', ['1.2.3'])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateImport > save expected event for MongoDocumentMirrorInformation', async () => {
    await connector.onCreateImport(
      createEventRequest,
      { id: 'mirrored-model' } as ModelInterface,
      'source-model',
      'exporter',
      {
        metadata: 'mongo-document',
        modelCardVersions: { version: 'version' },
        newModelCards: { modelId: 'modelId' },
        releaseSemvers: { semver: '1.2.3' },
        fileIds: 'fileId',
      } as unknown as MongoDocumentMirrorInformation,
    )
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateImport > save expected event for FileMirrorInformation', async () => {
    await connector.onCreateImport(
      createEventRequest,
      { id: 'mirrored-model' } as ModelInterface,
      'source-model',
      'exporter',
      { metadata: 'file', newPath: 'newPath' } as unknown as FileMirrorInformation,
    )
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateImport > save expected event for ImageMirrorInformation', async () => {
    await connector.onCreateImport(
      createEventRequest,
      { id: 'mirrored-model' } as ModelInterface,
      'source-model',
      'exporter',
      { metadata: 'metadata', image: { imageName: 'string', imageTag: 'string' } } as unknown as ImageMirrorInformation,
    )
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateReviewRole > save expected event', async () => {
    await connector.onCreateReviewRole(createEventRequest, { name: 'reviewRole' } as ReviewRoleInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewReviewRoles > save expected event', async () => {
    await connector.onViewReviewRoles(viewEventRequest, [{ name: 'reviewRole' } as ReviewRoleInterface])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onUpdateReviewRole > save expected event', async () => {
    await connector.onUpdateReviewRole(updateEventRequest, { name: 'reviewRole' } as ReviewRoleInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteReviewRole > save expected event', async () => {
    await connector.onDeleteReviewRole(deleteEventRequest, 'reviewRoleId')
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onError > save expected event for Create error', async () => {
    await connector.onError(createEventRequest, InternalError('Error'))
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onError > save expected event for View error', async () => {
    await connector.onError(viewEventRequest, InternalError('Error'))
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onError > save expected event for Delete error', async () => {
    await connector.onError(deleteEventRequest, InternalError('Error'))
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onError > save expected event for Update error', async () => {
    await connector.onError(updateEventRequest, InternalError('Error'))
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onError > save expected event for Search error', async () => {
    await connector.onError(searchEventRequest, InternalError('Error'))
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })
})
