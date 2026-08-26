import { MongoServerError } from 'mongodb'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import authentication from '../../src/connectors/authentication/index.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { EntryKind, EntryVisibility } from '../../src/models/Model.js'
import {
  createDeploymentAssessment,
  getDeploymentAssessmentById,
  removeDeploymentAssessment,
  searchDeploymentAssessments,
  updateDeploymentAssessment,
} from '../../src/services/deploymentAssessment.js'
import { SchemaKind } from '../../src/types/enums.js'
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
  })

  test('creates an incomplete draft without requiring optional fields', async () => {
    const metadata = { overview: { name: 'Draft assessment' } }

    await createDeploymentAssessment({ dn: 'creator' }, { ...params, draft: true, metadata })

    expect(DeploymentAssessmentModelMock).toHaveBeenCalledWith(expect.objectContaining({ draft: true }))
    expect(schemaMocks.validateContentAgainstSchema).toHaveBeenCalledWith(params.schemaId, metadata, { draft: true })
    expect(authentication.getUserInformation).not.toHaveBeenCalled()
    expect(ModelModelMock.find).not.toHaveBeenCalled()
    expect(idMocks.convertStringToId).toHaveBeenCalledWith('Draft assessment')
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
    ['only a name', { overview: { name: 'Assessment' } }],
    ['an empty model ID list', { overview: { name: 'Assessment', modelIds: [] } }],
    ['an empty justification', { overview: { name: 'Assessment', justification: '' } }],
    ['a risk owner but no models', { overview: { name: 'Assessment', riskOwner: 'user:risk-owner' } }],
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
      const metadata = { overview: { name: 'Updated assessment', riskOwner: 'user:risk-owner' } }

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
      ['a risk owner but no models', { overview: { name: 'Assessment', riskOwner: 'user:risk-owner' } }],
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
    test('soft deletes the assessment and returns it', async () => {
      const deploymentAssessment = { id: 'da-id', delete: vi.fn() }
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

      const result = await removeDeploymentAssessment({ dn: 'creator' }, 'da-id')

      expect(authorisation.deploymentAssessment).toHaveBeenCalledWith(
        { dn: 'creator' },
        deploymentAssessment,
        'deployment_assessment:delete',
      )
      expect(deploymentAssessment.delete).toHaveBeenCalledWith(undefined)
      expect(result).toBe(deploymentAssessment)
    })

    test('passes the transaction session through to the deletion', async () => {
      const deploymentAssessment = { id: 'da-id', delete: vi.fn() }
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      const session = {} as any

      await removeDeploymentAssessment({ dn: 'creator' }, 'da-id', session)

      expect(deploymentAssessment.delete).toHaveBeenCalledWith(session)
    })

    test('throws a not found error when the assessment does not exist', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(undefined)

      await expect(removeDeploymentAssessment({ dn: 'creator' }, 'da-id')).rejects.toMatchObject({ code: 404 })
    })

    test('rejects the deletion when authorisation fails', async () => {
      const deploymentAssessment = { id: 'da-id', delete: vi.fn() }
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      vi.mocked(authorisation.deploymentAssessment).mockResolvedValueOnce({
        success: false,
        info: 'You do not have permission to delete this Deployment Assessment',
        id: 'da-id',
      })

      await expect(removeDeploymentAssessment({ dn: 'otherUser' }, 'da-id')).rejects.toThrow(
        /^You do not have permission to delete this Deployment Assessment/,
      )
      expect(deploymentAssessment.delete).not.toHaveBeenCalled()
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
