import { MongoServerError } from 'mongodb'
import { Types } from 'mongoose'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import authentication from '../../src/connectors/authentication/index.js'
import { DeploymentAssessmentAction } from '../../src/connectors/authorisation/actions.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { EntryKind, EntryVisibility } from '../../src/models/Model.js'
import { Decision, ResponseKind } from '../../src/models/Response.js'
import {
  commentOnDeploymentAssessment,
  createDeploymentAssessment,
  getDeploymentAssessmentById,
  getDeploymentAssessmentDetails,
  removeDeploymentAssessment,
  reviewDeploymentAssessment,
  searchDeploymentAssessments,
  updateDeploymentAssessment,
} from '../../src/services/deploymentAssessment.js'
import { ReviewKind, SchemaKind } from '../../src/types/enums.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/authentication/index.js', () => ({
  default: { getUserInformation: vi.fn() },
}))

vi.mock('../../src/connectors/authorisation/index.js')

const idMocks = vi.hoisted(() => ({ convertStringToId: vi.fn(() => 'assessment-abc123') }))
vi.mock('../../src/utils/id.js', () => idMocks)

const schemaMocks = vi.hoisted(() => ({
  getSchemaById: vi.fn(),
  validateContentAgainstSchema: vi.fn(),
}))
vi.mock('../../src/services/schema.js', () => schemaMocks)

const smtpMocks = vi.hoisted(() => ({
  notifyDeploymentRiskOwner: vi.fn(),
  notifyDeploymentModelOwners: vi.fn(),
}))
vi.mock('../../src/services/smtp/smtp.js', () => smtpMocks)

const DeploymentAssessmentModelMock = getTypedModelMock('DeploymentAssessmentModel')
const ModelModelMock = getTypedModelMock('ModelModel')
const ResponseModelMock = getTypedModelMock('ResponseModel')
const ReviewModelMock = getTypedModelMock('ReviewModel')

const params = {
  name: 'Assessment',
  schemaId: 'deployment-assessment-schema',
  metadata: {
    overview: {
      riskOwner: ['user:risk-owner'],
      justification: 'Owns the deployment risk.',
      modelIds: ['model-one'],
    },
    assessment: { summary: 'Summary' },
  },
  draft: false,
}

const liveModel = {
  id: 'model-one',
  kind: EntryKind.Model,
  visibility: EntryVisibility.Public,
  state: 'Production',
  collaborators: [{ entity: 'user:user', roles: ['owner'] }],
}

describe('services > deploymentAssessment', () => {
  beforeEach(() => {
    vi.mocked(authentication.getUserInformation).mockResolvedValue({ name: 'Risk Owner' })
    schemaMocks.getSchemaById.mockResolvedValue({
      kind: SchemaKind.DeploymentAssessment,
      hidden: false,
      reviewRoles: ['configured-dro'],
    })
    schemaMocks.validateContentAgainstSchema.mockResolvedValue({ valid: true, errors: [] })
    ModelModelMock.find.mockResolvedValue([liveModel])
    vi.mocked(authorisation.deploymentAssessment).mockResolvedValue({ success: true, id: 'assessment-id' })
  })

  describe('getDeploymentAssessmentById', () => {
    test('gets an existing DA by its ID', async () => {
      const mockDA = {
        createdBy: 'creator',
        metadata: { overview: { riskOwner: ['user'] } },
      }
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(mockDA)

      const result = await getDeploymentAssessmentById({ dn: 'creator' }, 'da-id')

      expect(DeploymentAssessmentModelMock.findOne).toHaveBeenCalled()
      expect(result).toBe(mockDA)
    })

    test('no DA', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(undefined)

      await expect(() => getDeploymentAssessmentById({ dn: 'creator' }, 'da-id')).rejects.toThrow(
        /^The requested deployment assessment was not found/,
      )
    })

    test('forbidden when authorisation fails', async () => {
      const mockDA = {
        createdBy: 'creator',
        metadata: { overview: { riskOwner: ['user'] } },
      }
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(mockDA)
      vi.mocked(authorisation.deploymentAssessment).mockResolvedValueOnce({
        success: false,
        info: 'You do not have permission to view this Deployment Assessment',
        id: 'da-id',
      })

      await expect(() => getDeploymentAssessmentById({ dn: 'otherUser' }, 'da-id')).rejects.toThrow(
        /^You do not have permission to view this Deployment Assessment/,
      )
    })
  })

  test('creates an assessment with a generated ID and authenticated creator', async () => {
    const result = await createDeploymentAssessment({ dn: 'creator' }, params)

    expect(authentication.getUserInformation).toHaveBeenCalledWith('user:risk-owner')
    expect(ModelModelMock.find).toHaveBeenCalledWith({
      id: { $in: ['model-one'] },
    })
    expect(DeploymentAssessmentModelMock).toHaveBeenCalledWith({
      id: 'assessment-abc123',
      name: params.name,
      schemaId: params.schemaId,
      metadata: params.metadata,
      draft: params.draft,
      createdBy: 'creator',
    })
    expect(schemaMocks.validateContentAgainstSchema).toHaveBeenCalledWith(params.schemaId, params.metadata, {
      draft: false,
    })
    expect(result.save).toHaveBeenCalled()
    expect(ReviewModelMock).toHaveBeenCalledWith({
      kind: ReviewKind.DeploymentAssessment,
      deploymentAssessmentId: 'assessment-abc123',
      role: 'riskOwner',
    })
    expect(ReviewModelMock.save).toHaveBeenCalled()
  })

  test('creates an incomplete draft without requiring optional fields', async () => {
    const metadata = { overview: {} }

    await createDeploymentAssessment({ dn: 'creator' }, { ...params, name: 'Draft assessment', draft: true, metadata })

    expect(DeploymentAssessmentModelMock).toHaveBeenCalledWith(expect.objectContaining({ draft: true }))
    expect(schemaMocks.validateContentAgainstSchema).toHaveBeenCalledWith(params.schemaId, metadata, { draft: true })
    expect(authentication.getUserInformation).not.toHaveBeenCalled()
    expect(ModelModelMock.find).not.toHaveBeenCalled()
    expect(idMocks.convertStringToId).toHaveBeenCalledWith('Draft assessment')
    expect(ReviewModelMock).not.toHaveBeenCalled()
  })

  test('validates references supplied in a draft', async () => {
    await createDeploymentAssessment({ dn: 'creator' }, { ...params, draft: true })

    expect(authentication.getUserInformation).toHaveBeenCalledWith('user:risk-owner')
    expect(ModelModelMock.find).toHaveBeenCalledWith({
      id: { $in: ['model-one'] },
    })
  })

  test('rejects a risk owner that is not a user entity', async () => {
    await expect(
      createDeploymentAssessment(
        { dn: 'creator' },
        {
          ...params,
          metadata: { ...params.metadata, overview: { ...params.metadata.overview, riskOwner: ['group:risk'] } },
        },
      ),
    ).rejects.toThrow('The risk owner must be a valid user entity.')
    expect(ModelModelMock.find).not.toHaveBeenCalled()
  })

  test('rejects an unknown risk owner', async () => {
    vi.mocked(authentication.getUserInformation).mockRejectedValueOnce(new Error('Not found'))

    await expect(createDeploymentAssessment({ dn: 'creator' }, params)).rejects.toThrow(
      'The risk owner could not be found.',
    )
    expect(ModelModelMock.find).not.toHaveBeenCalled()
  })

  test('rejects a missing model', async () => {
    ModelModelMock.find.mockResolvedValueOnce([])

    await expect(createDeploymentAssessment({ dn: 'creator' }, params)).rejects.toThrow(
      'One or more models could not be found.',
    )
  })

  test('rejects a hidden schema', async () => {
    schemaMocks.getSchemaById.mockResolvedValueOnce({ kind: SchemaKind.DeploymentAssessment, hidden: true })

    await expect(createDeploymentAssessment({ dn: 'creator' }, params)).rejects.toThrow(
      'Cannot create a deployment assessment using a hidden schema.',
    )
    expect(schemaMocks.validateContentAgainstSchema).not.toHaveBeenCalled()
  })

  test('rejects a schema of the wrong type', async () => {
    schemaMocks.getSchemaById.mockResolvedValueOnce({ kind: SchemaKind.AccessRequest, hidden: false })

    await expect(createDeploymentAssessment({ dn: 'creator' }, params)).rejects.toThrow(
      'Deployment assessments must use a deployment assessment schema.',
    )
    expect(schemaMocks.validateContentAgainstSchema).not.toHaveBeenCalled()
  })

  test('rejects metadata that does not match the schema', async () => {
    schemaMocks.validateContentAgainstSchema.mockResolvedValueOnce({ valid: false, errors: [{ message: 'invalid' }] })

    await expect(createDeploymentAssessment({ dn: 'creator' }, params)).rejects.toThrow(
      'Deployment assessment metadata could not be validated against the schema.',
    )
    expect(authentication.getUserInformation).not.toHaveBeenCalled()
  })

  test.each([
    ['only a name', { overview: { name: 'Assessment' } }],
    ['an empty model ID list', { overview: { name: 'Assessment', modelIds: [] } }],
    ['an empty justification', { overview: { name: 'Assessment', justification: '' } }],
    ['a risk owner but no models', { overview: { name: 'Assessment', riskOwner: ['user:risk-owner'] } }],
    ['models but no risk owner', { overview: { name: 'Assessment', modelIds: ['model-one'] } }],
    ['repeated model IDs', { overview: { name: 'Assessment', modelIds: ['model-one', 'model-one'] } }],
  ])('accepts metadata with %s', async (_description, metadata) => {
    const result = await createDeploymentAssessment({ dn: 'creator' }, { ...params, draft: true, metadata })

    expect(DeploymentAssessmentModelMock).toHaveBeenCalledWith(expect.objectContaining({ metadata }))
    expect(idMocks.convertStringToId).toHaveBeenCalledWith('Assessment')
    expect(result.save).toHaveBeenCalled()
  })

  test.each([
    [{ ...liveModel, kind: EntryKind.DataCard }, 'One or more models could not be found.'],
    [{ ...liveModel, visibility: EntryVisibility.Private }, 'Deployment assessments can only use public models.'],
    [{ ...liveModel, state: 'Review' }, 'Deployment assessments can only use models with a Production state.'],
  ])('rejects an ineligible model', async (model, message) => {
    ModelModelMock.find.mockResolvedValueOnce([model])

    await expect(createDeploymentAssessment({ dn: 'creator' }, { ...params, draft: true })).rejects.toThrow(message)
    expect(DeploymentAssessmentModelMock).not.toHaveBeenCalled()
  })

  test('rejects creation when authorisation fails', async () => {
    vi.mocked(authorisation.deploymentAssessment).mockResolvedValueOnce({
      success: false,
      info: 'You do not have permission to create this Deployment Assessment',
      id: 'assessment-abc123',
    })

    await expect(createDeploymentAssessment({ dn: 'creator' }, params)).rejects.toThrow(
      /^You do not have permission to create this Deployment Assessment/,
    )
    expect(DeploymentAssessmentModelMock.save).not.toHaveBeenCalled()
  })

  test('returns a conflict when the generated ID already exists', async () => {
    const mongoError = new MongoServerError({})
    mongoError.code = 11000
    DeploymentAssessmentModelMock.save.mockRejectedValueOnce(mongoError)

    await expect(createDeploymentAssessment({ dn: 'creator' }, params)).rejects.toMatchObject({ code: 409 })
  })

  describe('comments and reviews', () => {
    const assessment = {
      _id: 'assessment-object-id',
      id: 'assessment-id',
      draft: false,
      createdBy: 'creator',
      metadata: { overview: { name: 'Assessment', riskOwner: ['user:risk-owner'] } },
    }
    const review = {
      _id: 'review-object-id',
      kind: ReviewKind.DeploymentAssessment,
      role: 'dro',
      createdAt: new Date('10/10/2026'),
    }

    test.each([false, true])('allows an authorised viewer to comment when draft is %s', async (draft) => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce({ ...assessment, draft })

      const response = await commentOnDeploymentAssessment({ dn: 'viewer' }, assessment.id, 'A question')

      expect(authorisation.deploymentAssessment).toHaveBeenCalledWith(
        { dn: 'viewer' },
        expect.objectContaining({ id: assessment.id, draft }),
        'deployment_assessment:view',
      )
      expect(ResponseModelMock).toHaveBeenCalledWith({
        entity: 'user:viewer',
        kind: ResponseKind.Comment,
        parentId: assessment._id,
        comment: 'A question',
      })
      expect(response.save).toHaveBeenCalled()
    })

    test('rejects a comment from a user who cannot view the assessment', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(assessment)
      vi.mocked(authorisation.deploymentAssessment).mockResolvedValueOnce({
        success: false,
        info: 'You do not have permission to view this Deployment Assessment',
        id: assessment.id,
      })

      await expect(commentOnDeploymentAssessment({ dn: 'viewer' }, assessment.id, 'A question')).rejects.toMatchObject({
        code: 403,
      })
      expect(ResponseModelMock).not.toHaveBeenCalled()
    })

    test('returns authorised comments and review history', async () => {
      const reviewResponses = [
        {
          _id: { toString: () => 'response-id' },
          kind: ResponseKind.Review,
          decision: Decision.Approve,
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ]
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(assessment)
      ReviewModelMock.findOne.mockReturnValueOnce({ sort: vi.fn().mockResolvedValue(review) })
      ResponseModelMock.find.mockResolvedValueOnce(reviewResponses)

      await expect(getDeploymentAssessmentDetails({ dn: 'viewer' }, assessment.id)).resolves.toEqual({
        deploymentAssessment: assessment,
        responses: reviewResponses,
        state: 'approved',
      })
      expect(ResponseModelMock.find).toHaveBeenCalledWith({ parentId: review._id })
    })

    test('does not read history when assessment view authorisation fails', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(assessment)
      vi.mocked(authorisation.deploymentAssessment).mockResolvedValueOnce({
        success: false,
        info: 'Forbidden',
        id: assessment.id,
      })

      await expect(getDeploymentAssessmentDetails({ dn: 'viewer' }, assessment.id)).rejects.toMatchObject({ code: 403 })
      expect(ResponseModelMock.find).not.toHaveBeenCalled()
      expect(ReviewModelMock.aggregate).not.toHaveBeenCalled()
    })

    test('allows the risk owner to request changes', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(assessment)
      ReviewModelMock.findOne.mockReturnValueOnce({ sort: vi.fn().mockResolvedValue(review) })
      ResponseModelMock.findOne.mockReturnValueOnce({ sort: vi.fn().mockResolvedValue(undefined) })

      const response = await reviewDeploymentAssessment(
        { dn: 'risk-owner' },
        assessment.id,
        Decision.RequestChanges,
        'Please update this.',
      )

      expect(authorisation.deploymentAssessment).toHaveBeenCalledWith(
        { dn: 'risk-owner' },
        assessment,
        DeploymentAssessmentAction.Update,
      )
      expect(ResponseModelMock).toHaveBeenCalledWith({
        entity: 'user:risk-owner',
        kind: ResponseKind.Review,
        role: 'dro',
        parentId: review._id,
        decision: Decision.RequestChanges,
        comment: 'Please update this.',
      })
      expect(response.save).toHaveBeenCalled()
    })

    test('rejects a decision on a draft', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce({ ...assessment, draft: true })

      await expect(
        reviewDeploymentAssessment({ dn: 'risk-owner' }, assessment.id, Decision.Approve),
      ).rejects.toMatchObject({ code: 400 })
      expect(ReviewModelMock.findOne).not.toHaveBeenCalled()
    })

    test('rejects a decision from a viewer who is not the risk owner', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(assessment)
      vi.mocked(authorisation.deploymentAssessment)
        .mockResolvedValueOnce({ success: true, id: assessment.id })
        .mockResolvedValueOnce({ success: false, info: 'Forbidden', id: assessment.id })

      await expect(reviewDeploymentAssessment({ dn: 'viewer' }, assessment.id, Decision.Approve)).rejects.toMatchObject(
        {
          code: 403,
        },
      )
      expect(ReviewModelMock.findOne).not.toHaveBeenCalled()
    })

    test.each([Decision.Approve, Decision.Reject])('allows a new decision after a %s decision', async (decision) => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(assessment)
      ReviewModelMock.findOne.mockReturnValueOnce({ sort: vi.fn().mockResolvedValue(review) })
      ResponseModelMock.findOne.mockReturnValueOnce({ sort: vi.fn().mockResolvedValue({ decision }) })

      await expect(
        reviewDeploymentAssessment({ dn: 'risk-owner' }, assessment.id, Decision.Approve),
      ).resolves.toBeDefined()
      expect(ResponseModelMock).toHaveBeenCalledWith(expect.objectContaining({ decision: Decision.Approve }))
    })

    test('allows a decision after changes were requested', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(assessment)
      ReviewModelMock.findOne.mockReturnValueOnce({ sort: vi.fn().mockResolvedValue(review) })
      ResponseModelMock.findOne.mockReturnValueOnce({
        sort: vi.fn().mockResolvedValue({ decision: Decision.RequestChanges }),
      })

      await expect(
        reviewDeploymentAssessment({ dn: 'risk-owner' }, assessment.id, Decision.Approve),
      ).resolves.toBeDefined()
      expect(ResponseModelMock).toHaveBeenCalledWith(expect.objectContaining({ decision: Decision.Approve }))
    })
  })

  describe('updateDeploymentAssessment', () => {
    const existingDeploymentAssessment = () => ({
      id: 'da-id',
      schemaId: params.schemaId,
      metadata: params.metadata,
      draft: true,
      createdBy: 'creator',
      markModified: vi.fn(),
      save: vi.fn(),
    })

    test('stores the validated metadata', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      const metadata = { overview: { name: 'Updated assessment', riskOwner: ['user:risk-owner'] } }

      const result = await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { metadata, draft: false })

      expect(schemaMocks.validateContentAgainstSchema).toHaveBeenCalledWith(params.schemaId, metadata, { draft: false })
      expect(result.metadata).toStrictEqual(metadata)
      expect(result.draft).toBe(false)
      expect(deploymentAssessment.markModified).toHaveBeenCalledWith('metadata')
      expect(deploymentAssessment.markModified).toHaveBeenCalledWith('draft')
      expect(deploymentAssessment.save).toHaveBeenCalled()
    })

    test('leaves the draft status unchanged when the diff omits it', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

      const result = await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', {
        metadata: params.metadata,
      })

      expect(schemaMocks.validateContentAgainstSchema).toHaveBeenCalledWith(params.schemaId, params.metadata, {
        draft: true,
      })
      expect(result.draft).toBe(true)
      expect(deploymentAssessment.markModified).not.toHaveBeenCalledWith('draft')
    })

    test('rejects an update when authorisation fails', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      vi.mocked(authorisation.deploymentAssessment)
        .mockResolvedValueOnce({ success: true, id: 'da-id' })
        .mockResolvedValueOnce({
          success: false,
          info: 'You do not have permission to update this Deployment Assessment',
          id: 'da-id',
        })

      await expect(updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { draft: false })).rejects.toThrow(
        /^You do not have permission to update this Deployment Assessment/,
      )
      expect(schemaMocks.validateContentAgainstSchema).not.toHaveBeenCalled()
      expect(deploymentAssessment.save).not.toHaveBeenCalled()
    })

    test('validates the existing metadata when the diff omits it', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

      await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { draft: false })

      expect(schemaMocks.validateContentAgainstSchema).toHaveBeenCalledWith(params.schemaId, params.metadata, {
        draft: false,
      })
      expect(deploymentAssessment.markModified).not.toHaveBeenCalledWith('metadata')
    })

    test.each([
      ['only a name', { overview: { name: 'Assessment' } }],
      ['an empty model ID list', { overview: { name: 'Assessment', modelIds: [] } }],
      ['an empty justification', { overview: { name: 'Assessment', justification: '' } }],
      ['a risk owner but no models', { overview: { name: 'Assessment', riskOwner: ['user:risk-owner'] } }],
      ['models but no risk owner', { overview: { name: 'Assessment', modelIds: ['model-one'] } }],
      ['repeated model IDs', { overview: { name: 'Assessment', modelIds: ['model-one', 'model-one'] } }],
    ])('accepts a draft update with metadata with %s', async (_description, metadata) => {
      const deploymentAssessment = existingDeploymentAssessment()
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

      const result = await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { metadata })

      expect(schemaMocks.validateContentAgainstSchema).toHaveBeenCalledWith(params.schemaId, metadata, { draft: true })
      expect(result.metadata).toStrictEqual(metadata)
      expect(deploymentAssessment.markModified).toHaveBeenCalledWith('metadata')
      expect(deploymentAssessment.save).toHaveBeenCalled()
    })

    test('rejects switching released DA back to a draft', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      deploymentAssessment.draft = false
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

      await expect(updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { draft: true })).rejects.toThrow(
        'Cannot convert a submitted deployment assessment back to a draft.',
      )
      expect(deploymentAssessment.save).not.toHaveBeenCalled()
    })

    test('notifies stakeholders when a draft is submitted', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      // the notification lookup uses `.lean()`, unlike the validation lookup
      ModelModelMock.find.mockResolvedValueOnce([liveModel]).mockReturnValueOnce({ lean: () => [liveModel] })

      await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { draft: false })

      expect(smtpMocks.notifyDeploymentRiskOwner).toHaveBeenCalledWith(
        'user:risk-owner',
        deploymentAssessment,
        'Risk Owner',
      )
      expect(smtpMocks.notifyDeploymentModelOwners).toHaveBeenCalled()
    })

    test('notifies each risk owner once when a draft with several is submitted', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      deploymentAssessment.metadata = {
        ...params.metadata,
        overview: {
          ...params.metadata.overview,
          riskOwner: ['user:risk-owner', 'user:other-owner', 'user:risk-owner'],
        },
      }
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      // the notification lookup uses `.lean()`, unlike the validation lookup
      ModelModelMock.find.mockResolvedValueOnce([liveModel]).mockReturnValueOnce({ lean: () => [liveModel] })

      await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { draft: false })

      expect(smtpMocks.notifyDeploymentRiskOwner).toHaveBeenCalledTimes(2)
      expect(smtpMocks.notifyDeploymentRiskOwner).toHaveBeenCalledWith(
        'user:risk-owner',
        deploymentAssessment,
        'Risk Owner',
      )
      expect(smtpMocks.notifyDeploymentRiskOwner).toHaveBeenCalledWith(
        'user:other-owner',
        deploymentAssessment,
        'Risk Owner',
      )
    })

    test('does not notify stakeholders when the assessment stays a draft', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

      await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { metadata: params.metadata })

      expect(smtpMocks.notifyDeploymentRiskOwner).not.toHaveBeenCalled()
      expect(smtpMocks.notifyDeploymentModelOwners).not.toHaveBeenCalled()
    })

    test('does not re-notify stakeholders when an already submitted assessment is edited', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      deploymentAssessment.draft = false
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

      await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { draft: false })

      expect(smtpMocks.notifyDeploymentRiskOwner).not.toHaveBeenCalled()
      expect(smtpMocks.notifyDeploymentModelOwners).not.toHaveBeenCalled()
    })
  })

  describe('removeDeploymentAssessment', () => {
    const assessmentId = new Types.ObjectId()
    const reviewId = new Types.ObjectId()

    // The assessment's children are removed before the assessment itself. `ReviewModel.find` is called twice - once
    // to collect the parent IDs for the responses, and again inside `removeDeploymentAssessmentReviews`.
    const mockAssessmentWithChildren = () => {
      const deploymentAssessment = { id: 'da-id', _id: assessmentId, draft: false, delete: vi.fn() }
      const review = { _id: reviewId }

      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      ReviewModelMock.find.mockResolvedValueOnce([review]).mockResolvedValueOnce([review])
      ResponseModelMock.find.mockResolvedValueOnce([{ _id: new Types.ObjectId() }])

      return { deploymentAssessment }
    }

    test('soft deletes the assessment and returns it', async () => {
      const { deploymentAssessment } = mockAssessmentWithChildren()

      const result = await removeDeploymentAssessment({ dn: 'creator' }, 'da-id')

      expect(authorisation.deploymentAssessment).toHaveBeenCalledWith(
        { dn: 'creator' },
        deploymentAssessment,
        'deployment_assessment:delete',
      )
      expect(deploymentAssessment.delete).toHaveBeenCalledWith(undefined)
      expect(result).toBe(deploymentAssessment)
    })

    test('deletes the comments and review responses belonging to the assessment', async () => {
      mockAssessmentWithChildren()

      await removeDeploymentAssessment({ dn: 'creator' }, 'da-id')

      expect(ResponseModelMock.deleteMany).toHaveBeenCalledWith(
        { parentId: { $in: [assessmentId, reviewId] } },
        undefined,
      )
    })

    test('deletes the reviews belonging to the assessment', async () => {
      mockAssessmentWithChildren()

      await removeDeploymentAssessment({ dn: 'creator' }, 'da-id')

      expect(ReviewModelMock.deleteMany).toHaveBeenCalledWith({ deploymentAssessmentId: 'da-id' }, undefined)
    })

    test('deletes an assessment that has no reviews or responses', async () => {
      const deploymentAssessment = { id: 'da-id', _id: assessmentId, draft: true, delete: vi.fn() }
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      ReviewModelMock.find.mockResolvedValueOnce([]).mockResolvedValueOnce([])
      ResponseModelMock.find.mockResolvedValueOnce([])

      await removeDeploymentAssessment({ dn: 'creator' }, 'da-id')

      expect(ResponseModelMock.deleteMany).toHaveBeenCalledWith({ parentId: { $in: [assessmentId] } }, undefined)
      expect(ReviewModelMock.deleteMany).toHaveBeenCalledWith({ deploymentAssessmentId: 'da-id' }, undefined)
      expect(deploymentAssessment.delete).toHaveBeenCalledWith(undefined)
    })

    test('passes the transaction session through to every deletion', async () => {
      const { deploymentAssessment } = mockAssessmentWithChildren()
      const session = {} as any

      await removeDeploymentAssessment({ dn: 'creator' }, 'da-id', session)

      expect(ReviewModelMock.find).toHaveBeenCalledWith({ deploymentAssessmentId: 'da-id' }, undefined, { session })
      expect(ResponseModelMock.deleteMany).toHaveBeenCalledWith(
        { parentId: { $in: [assessmentId, reviewId] } },
        session,
      )
      expect(ReviewModelMock.deleteMany).toHaveBeenCalledWith({ deploymentAssessmentId: 'da-id' }, session)
      expect(deploymentAssessment.delete).toHaveBeenCalledWith(session)
    })

    test('throws a not found error when the assessment does not exist', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(undefined)

      await expect(removeDeploymentAssessment({ dn: 'creator' }, 'da-id')).rejects.toMatchObject({ code: 404 })
    })

    test('rejects the deletion when the user cannot view the assessment', async () => {
      const { deploymentAssessment } = mockAssessmentWithChildren()
      vi.mocked(authorisation.deploymentAssessment).mockResolvedValueOnce({
        success: false,
        info: 'You do not have permission to view this Deployment Assessment',
        id: 'da-id',
      })

      await expect(removeDeploymentAssessment({ dn: 'otherUser' }, 'da-id')).rejects.toThrow(
        /^You do not have permission to view this Deployment Assessment/,
      )
      expect(deploymentAssessment.delete).not.toHaveBeenCalled()
    })

    test('rejects the deletion when authorisation fails', async () => {
      const { deploymentAssessment } = mockAssessmentWithChildren()
      vi.mocked(authorisation.deploymentAssessment)
        .mockResolvedValueOnce({ success: true, id: 'da-id' })
        .mockResolvedValueOnce({
          success: false,
          info: 'You do not have permission to delete this Deployment Assessment',
          id: 'da-id',
        })

      await expect(removeDeploymentAssessment({ dn: 'otherUser' }, 'da-id')).rejects.toThrow(
        /^You do not have permission to delete this Deployment Assessment/,
      )
      expect(deploymentAssessment.delete).not.toHaveBeenCalled()
      expect(ResponseModelMock.deleteMany).not.toHaveBeenCalled()
      expect(ReviewModelMock.deleteMany).not.toHaveBeenCalled()
    })
  })

  describe('searchDeploymentAssessments', () => {
    test('returns visible deployment assessments ordered by draft status and most recently updated', async () => {
      const deploymentAssessments = [{ id: 'assessment-one' }]
      const sort = vi.fn().mockResolvedValue(deploymentAssessments)
      DeploymentAssessmentModelMock.find.mockReturnValueOnce({ sort })
      vi.mocked(authorisation.deploymentAssessments).mockResolvedValueOnce([{ success: true, id: 'assessment-one' }])

      const result = await searchDeploymentAssessments({ dn: 'creator' }, {})

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({})
      expect(sort).toHaveBeenCalledWith({ draft: -1, updatedAt: -1 })
      expect(authorisation.deploymentAssessments).toHaveBeenCalledWith(
        { dn: 'creator' },
        deploymentAssessments,
        'deployment_assessment:view',
      )
      expect(result).toStrictEqual(deploymentAssessments)
    })

    test('combines model, risk owner, creator, creation window, and name filters', async () => {
      const sort = vi.fn().mockResolvedValue([])
      DeploymentAssessmentModelMock.find.mockReturnValueOnce({ sort })
      vi.mocked(authorisation.deploymentAssessments).mockResolvedValueOnce([])

      await searchDeploymentAssessments(
        { dn: 'creator' },
        {
          schemaId: 'deployment-assessment-schema',
          modelIds: ['model-one', 'model-two'],
          riskOwner: 'user:risk-owner',
          createdBy: 'creator',
          createdAfter: '2026-01-01',
          createdBefore: '2026-01-31',
          draft: true,
          search: 'Assessment.*',
          state: 'approved',
        },
      )

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({
        schemaId: 'deployment-assessment-schema',
        'metadata.overview.modelIds': { $all: ['model-one', 'model-two'] },
        'metadata.overview.riskOwner': { $elemMatch: { $eq: 'user:risk-owner' } },
        createdBy: 'creator',
        createdAt: {
          $gte: new Date('2026-01-01T00:00:00.000Z'),
          $lt: new Date('2026-02-01T00:00:00.000Z'),
        },
        draft: true,
        $and: [
          {
            $or: [
              { name: { $regex: 'Assessment\\.\\*', $options: 'i' } },
              { 'metadata.overview.justification': { $regex: 'Assessment\\.\\*', $options: 'i' } },
            ],
          },
        ],
      })
      expect(sort).toHaveBeenCalledWith({ draft: -1, updatedAt: -1 })
    })

    test('filters authorised assessments by their latest decision state', async () => {
      const approved = { id: 'approved-assessment', draft: false }
      const rejected = { id: 'rejected-assessment', draft: false }
      const sort = vi.fn().mockResolvedValue([approved, rejected])
      DeploymentAssessmentModelMock.find.mockReturnValueOnce({ sort })
      vi.mocked(authorisation.deploymentAssessments).mockResolvedValueOnce([
        { success: true, id: approved.id },
        { success: true, id: rejected.id },
      ])
      ReviewModelMock.aggregate.mockResolvedValueOnce([
        { _id: approved.id, decision: Decision.Approve },
        { _id: rejected.id, decision: Decision.Reject },
      ])

      const result = await searchDeploymentAssessments({ dn: 'creator' }, { state: 'approved' })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ id: approved.id, state: 'approved' })
    })

    test.each([
      ['after', { createdAfter: '2026-01-01' }, { $gte: new Date('2026-01-01T00:00:00.000Z') }],
      ['before', { createdBefore: '2026-01-31' }, { $lt: new Date('2026-02-01T00:00:00.000Z') }],
    ])('supports a creation window with only a %s boundary', async (_boundary, params, expectedCreatedAt) => {
      const sort = vi.fn().mockResolvedValue([])
      DeploymentAssessmentModelMock.find.mockReturnValueOnce({ sort })
      vi.mocked(authorisation.deploymentAssessments).mockResolvedValueOnce([])

      await searchDeploymentAssessments({ dn: 'creator' }, params)

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({
        createdAt: expectedCreatedAt,
      })
    })
  })
})
