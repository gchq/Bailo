import { Request } from 'express'
import { describe, expect, test, vi } from 'vitest'

import { DeleteFileArgs } from '../../../src/connectors/audit/Base.js'
import { StroomAuditConnector } from '../../../src/connectors/audit/stroom.js'
import { AccessRequestDoc } from '../../../src/models/AccessRequest.js'
import { FileInterfaceDoc, FileWithScanResultsInterface } from '../../../src/models/File.js'
import { InferenceDoc } from '../../../src/models/Inference.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../../src/models/Model.js'
import { ReleaseDoc } from '../../../src/models/Release.js'
import { ResponseInterface } from '../../../src/models/Response.js'
import { ReviewInterface } from '../../../src/models/Review.js'
import { SchemaInterface } from '../../../src/models/Schema.js'
import { TokenDoc } from '../../../src/models/Token.js'
import { InternalError } from '../../../src/utils/error.js'

vi.mock('../../../src/utils/config.js')

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

describe('connectors > audit > gchq', () => {
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

  test('onUpdateModel > save expected event', async () => {
    await connector.onUpdateModel(createEventRequest, { id: 'test-model' } as ModelDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onSearchModel > save expected event', async () => {
    await connector.onSearchModel(searchEventRequest, [{ id: 'test-model' } as ModelInterface])
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

  // HS conflict, updated test
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
      kind: 'byFile',
      file: { _id: 'test-file', name: 'myFile' } as unknown as FileWithScanResultsInterface,
    } as unknown as DeleteFileArgs)
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

  test('onCreateReviewResponse > save expected event', async () => {
    await connector.onCreateReviewResponse(createEventRequest, { _id: 'abc' as any } as ResponseInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onSearchSchemas > save expected event', async () => {
    await connector.onSearchSchemas(searchEventRequest, [{ id: 'id' } as SchemaInterface])
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

  test('onUpdateSchema > save expected event', async () => {
    await connector.onUpdateSchema(updateEventRequest, { id: 'id' } as SchemaInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onDeleteSchema > save expected event', async () => {
    await connector.onDeleteSchema(deleteEventRequest, 'id')
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

  test('onViewInferences > save expected event', async () => {
    await connector.onViewInferences(viewEventRequest, [{ id: 'id' } as InferenceDoc])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewInference > save expected event', async () => {
    await connector.onViewInference(viewEventRequest, { id: 'id' } as InferenceDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onUpdateInference > save expected event', async () => {
    await connector.onUpdateInference(updateEventRequest, { id: 'id' } as InferenceDoc)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onCreateInference > save expected event', async () => {
    await connector.onCreateInference(createEventRequest, { id: 'id' } as InferenceDoc)
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

  test('onCreateCommentResponse > save expected event', async () => {
    await connector.onCreateCommentResponse(createEventRequest, { _id: 'acb' as any } as ResponseInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  // HS - incorrect test, may need to configure!
  test('onUpdateResponse > save expected event', async () => {
    await connector.onUpdateResponse(updateEventRequest, { _id: 'acb' as any } as ResponseInterface)
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })

  test('onViewResponses > save expected event', async () => {
    await connector.onViewResponses(viewEventRequest, [{ _id: 'acb' as any } as ResponseInterface])
    expect(mockStroomService.saveEvent.mock.calls.at(0)).toMatchSnapshot()
  })
})
