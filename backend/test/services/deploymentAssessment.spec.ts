import { MongoServerError } from 'mongodb'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import authentication from '../../src/connectors/authentication/index.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { EntryKind, EntryVisibility } from '../../src/models/Model.js'
import { Decision, ResponseKind } from '../../src/models/Response.js'
import {
  commentOnDeploymentAssessment,
  createDeploymentAssessment,
  getDeploymentAssessmentById,
  getDeploymentAssessmentDetails,
  reviewDeploymentAssessment,
  searchDeploymentAssessments,
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

const DeploymentAssessmentModelMock = getTypedModelMock('DeploymentAssessmentModel')
const ModelModelMock = getTypedModelMock('ModelModel')
const ResponseModelMock = getTypedModelMock('ResponseModel')
const ReviewModelMock = getTypedModelMock('ReviewModel')

const params = {
  schemaId: 'deployment-assessment-schema',
  metadata: {
    overview: {
      name: 'Assessment',
      riskOwner: 'user:risk-owner',
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
    schemaMocks.getSchemaById.mockResolvedValue({ kind: SchemaKind.DeploymentAssessment, hidden: false })
    schemaMocks.validateContentAgainstSchema.mockResolvedValue({ valid: true, errors: [] })
    ModelModelMock.find.mockResolvedValue([liveModel])
  })

  describe('getDeploymentAssessmentById', () => {
    test('gets an existing DA by its ID', async () => {
      const mockDA = {
        createdBy: 'creator',
        metadata: { overview: { riskOwner: 'user' } },
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
        metadata: { overview: { riskOwner: 'user' } },
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
      role: 'dro',
    })
    expect(ReviewModelMock.save).toHaveBeenCalled()
  })

  test('creates an incomplete draft without requiring optional fields', async () => {
    const metadata = { overview: { name: 'Draft assessment' } }

    await createDeploymentAssessment({ dn: 'creator' }, { ...params, draft: true, metadata })

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
          metadata: { ...params.metadata, overview: { ...params.metadata.overview, riskOwner: 'group:risk' } },
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
    [{ ...liveModel, kind: EntryKind.DataCard }, 'One or more models could not be found.'],
    [{ ...liveModel, visibility: EntryVisibility.Private }, 'Deployment assessments can only use public models.'],
    [{ ...liveModel, state: 'Review' }, 'Deployment assessments can only use models with a production state.'],
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
      metadata: { overview: { name: 'Assessment', riskOwner: 'user:risk-owner' } },
    }
    const review = { _id: 'review-object-id', kind: ReviewKind.DeploymentAssessment, role: 'dro' }

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
      const comments = [{ kind: ResponseKind.Comment, comment: 'A question' }]
      const reviews = [
        {
          review,
          responses: [
            {
              _id: { toString: () => 'response-id' },
              kind: ResponseKind.Review,
              decision: Decision.Approve,
              createdAt: '2026-01-02T00:00:00.000Z',
            },
          ],
        },
      ]
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(assessment)
      ResponseModelMock.find.mockResolvedValueOnce(comments)
      ReviewModelMock.aggregate.mockResolvedValueOnce(reviews)

      await expect(getDeploymentAssessmentDetails({ dn: 'viewer' }, assessment.id)).resolves.toEqual({
        deploymentAssessment: assessment,
        responses: [comments[0], reviews[0].responses[0]],
        state: 'approved',
      })
      expect(ResponseModelMock.find).toHaveBeenCalledWith({
        parentId: assessment._id,
        kind: ResponseKind.Comment,
      })
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
        'metadata.overview.riskOwner': 'user:risk-owner',
        createdBy: 'creator',
        createdAt: {
          $gte: new Date('2026-01-01T00:00:00.000Z'),
          $lt: new Date('2026-02-01T00:00:00.000Z'),
        },
        draft: true,
        $and: [
          {
            $or: [
              { 'metadata.overview.name': { $regex: 'Assessment\\.\\*', $options: 'i' } },
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
    test('rejects a non-draft assessment without a risk owner', async () => {
      const metadata = {
        overview: {
          name: 'Submitted assessment',
        },
      }

      await expect(
        createDeploymentAssessment({ dn: 'creator' }, { ...params, draft: false, metadata }),
      ).rejects.toThrow('Deployment risk owner is required')
    })
  })
})
