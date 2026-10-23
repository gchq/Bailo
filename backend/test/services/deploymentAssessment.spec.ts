import { MongoServerError } from 'mongodb'
import { Types } from 'mongoose'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import authentication from '../../src/connectors/authentication/index.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { EntryKind, EntryVisibility } from '../../src/models/Model.js'
import { ResponseKind } from '../../src/models/Response.js'
import {
  commentOnDeploymentAssessment,
  createDeploymentAssessment,
  getDeploymentAssessmentById,
  getDeploymentAssessmentDetails,
  removeDeploymentAssessment,
  searchDeploymentAssessments,
  updateDeploymentAssessment,
} from '../../src/services/deploymentAssessment.js'
import { SchemaKind } from '../../src/types/enums.js'
import config from '../../src/utils/config.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

const repositoryMocks = vi.hoisted(() => ({
  findDeploymentAssessments: vi.fn(),
  findLatestDecisionsByAssessmentIds: vi.fn(),
}))
vi.mock('../../src/repositories/deploymentAssessment.js', () => repositoryMocks)

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
  notifyRiskOwnerOfDeploymentAssessment: vi.fn(),
  notifyModelOwnersOfDeploymentAssessment: vi.fn(),
}))
vi.mock('../../src/services/smtp/smtp.js', () => smtpMocks)

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
}))
vi.mock('../../src/services/log.js', () => ({ default: logMock }))

const DeploymentAssessmentModelMock = getTypedModelMock('DeploymentAssessmentModel')
const ModelModelMock = getTypedModelMock('ModelModel')
const ResponseModelMock = getTypedModelMock('ResponseModel')

const params = {
  name: 'Assessment',
  schemaId: 'deployment-assessment-schema',
  metadata: {
    modelOverview: {
      modelIds: ['model-one'],
    },
    signOff: {
      riskOwners: ['user:risk-owner'],
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
    config.ui.deploymentAssessments.deployableModelState = 'Production'
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
        metadata: { signOff: { riskOwners: ['user'] } },
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
        metadata: { signOff: { riskOwners: ['user'] } },
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
  })

  test('creates an incomplete draft without requiring optional fields', async () => {
    const metadata = { modelOverview: {}, signOff: {} }

    await createDeploymentAssessment({ dn: 'creator' }, { ...params, name: 'Draft assessment', draft: true, metadata })

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
          metadata: { ...params.metadata, signOff: { ...params.metadata.signOff, riskOwners: ['group:risk'] } },
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

  test('rejects a model the user is not authorised to view', async () => {
    vi.mocked(authorisation.models).mockResolvedValueOnce([{ success: false, id: 'model-one', info: '' }])

    await expect(createDeploymentAssessment({ dn: 'creator' }, params)).rejects.toThrow(
      'You do not have permission to use one or more of the specified models.',
    )
    expect(DeploymentAssessmentModelMock).not.toHaveBeenCalled()
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
    ['an empty model ID list', { overview: { name: 'Assessment' }, modelOverview: { modelIds: [] } }],
    ['a risk owner but no models', { overview: { name: 'Assessment' }, signOff: { riskOwners: ['user:risk-owner'] } }],
    ['models but no risk owner', { overview: { name: 'Assessment' }, modelOverview: { modelIds: ['model-one'] } }],
    [
      'repeated model IDs',
      { overview: { name: 'Assessment', modelOverview: { modelIds: ['model-one', 'model-one'] } } },
    ],
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

  test('accepts models in any state when no deployable model state is configured', async () => {
    config.ui.deploymentAssessments.deployableModelState = null
    ModelModelMock.find.mockResolvedValueOnce([{ ...liveModel, state: 'Review' }])

    const result = await createDeploymentAssessment({ dn: 'creator' }, { ...params, draft: true })

    expect(result.save).toHaveBeenCalled()
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

  describe('comments', () => {
    const assessment = {
      _id: 'assessment-object-id',
      id: 'assessment-id',
      draft: false,
      createdBy: 'creator',
      metadata: { overview: { name: 'Assessment' }, signOff: { riskOwners: ['user:risk-owner'] } },
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

    test('does not read history when assessment view authorisation fails', async () => {
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(assessment)
      vi.mocked(authorisation.deploymentAssessment).mockResolvedValueOnce({
        success: false,
        info: 'Forbidden',
        id: assessment.id,
      })

      await expect(getDeploymentAssessmentDetails({ dn: 'viewer' }, assessment.id)).rejects.toMatchObject({ code: 403 })
      expect(ResponseModelMock.find).not.toHaveBeenCalled()
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
      const metadata = {
        assessment: { summary: 'Summary' },
        modelOverview: { modelIds: ['model-one'] },
        signOff: { riskOwners: ['user:risk-owner'] },
      }

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

    test('rejects a model the user is not authorised to view', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      vi.mocked(authorisation.models).mockResolvedValueOnce([{ success: false, id: 'model-one', info: '' }])

      await expect(
        updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { metadata: params.metadata }),
      ).rejects.toThrow('You do not have permission to use one or more of the specified models.')
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
      [
        'only a name',
        { overview: { name: 'Assessment' }, modelOverview: { modelIds: [] }, signOff: { riskOwners: [] } },
      ],
      [
        'an empty model ID list',
        { overview: { name: 'Assessment' }, modelOverview: { modelIds: [] }, signOff: { riskOwners: [] } },
      ],
      [
        'a risk owner but no models',
        {
          assessment: { summary: 'Summary' },
          signOff: { riskOwners: ['user:risk-owner'] },
          modelOverview: { modelIds: [] },
        },
      ],
      [
        'models but no risk owner',
        {
          assessment: { summary: 'Summary' },
          modelOverview: { modelIds: ['model-one'] },
          signOff: { riskOwners: [] },
        },
      ],
      [
        'repeated model IDs',
        {
          assessment: { summary: 'Summary' },
          modelOverview: { modelIds: ['model-one', 'model-one'] },
          signOff: { riskOwners: ['user:risk-owner'] },
        },
      ],
    ])('accepts a draft update with metadata with %s', async (_description, metadata) => {
      const deploymentAssessment = existingDeploymentAssessment()
      deploymentAssessment.metadata = metadata as any
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

      expect(smtpMocks.notifyRiskOwnerOfDeploymentAssessment).toHaveBeenCalledWith(
        'user:risk-owner',
        deploymentAssessment,
        'Risk Owner',
      )
      expect(smtpMocks.notifyModelOwnersOfDeploymentAssessment).toHaveBeenCalled()
    })

    test('notifies each risk owner when a draft with several is submitted', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      deploymentAssessment.metadata = {
        ...params.metadata,
        signOff: {
          ...params.metadata.signOff,
          riskOwners: ['user:risk-owner', 'user:other-owner'],
        },
      }
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      // the notification lookup uses `.lean()`, unlike the validation lookup
      ModelModelMock.find.mockResolvedValueOnce([liveModel]).mockReturnValueOnce({ lean: () => [liveModel] })

      await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { draft: false })

      expect(smtpMocks.notifyRiskOwnerOfDeploymentAssessment).toHaveBeenCalledTimes(2)
      expect(smtpMocks.notifyRiskOwnerOfDeploymentAssessment).toHaveBeenCalledWith(
        'user:risk-owner',
        deploymentAssessment,
        'Risk Owner',
      )
      expect(smtpMocks.notifyRiskOwnerOfDeploymentAssessment).toHaveBeenCalledWith(
        'user:other-owner',
        deploymentAssessment,
        'Risk Owner',
      )
    })

    test('does not notify stakeholders when the assessment stays a draft', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

      await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { metadata: params.metadata })

      expect(smtpMocks.notifyRiskOwnerOfDeploymentAssessment).not.toHaveBeenCalled()
      expect(smtpMocks.notifyModelOwnersOfDeploymentAssessment).not.toHaveBeenCalled()
    })

    test('does not re-notify stakeholders when an already submitted assessment is edited', async () => {
      const deploymentAssessment = existingDeploymentAssessment()
      deploymentAssessment.draft = false
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

      await updateDeploymentAssessment({ dn: 'creator' }, 'da-id', { draft: false })

      expect(smtpMocks.notifyRiskOwnerOfDeploymentAssessment).not.toHaveBeenCalled()
      expect(smtpMocks.notifyModelOwnersOfDeploymentAssessment).not.toHaveBeenCalled()
    })
  })

  describe('removeDeploymentAssessment', () => {
    const assessmentId = new Types.ObjectId()

    // The assessment's children are removed before the assessment itself. `ReviewModel.find` is called twice - once
    // to collect the parent IDs for the responses.
    const mockAssessmentWithChildren = () => {
      const deploymentAssessment = { id: 'da-id', _id: assessmentId, draft: false, delete: vi.fn() }

      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)

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

    test('deletes the comments belonging to the assessment', async () => {
      mockAssessmentWithChildren()

      await removeDeploymentAssessment({ dn: 'creator' }, 'da-id')

      expect(ResponseModelMock.deleteMany).toHaveBeenCalledWith({ parentId: { $in: [assessmentId] } }, undefined)
    })

    test('deletes an assessment that has no responses', async () => {
      const deploymentAssessment = { id: 'da-id', _id: assessmentId, draft: true, delete: vi.fn() }
      DeploymentAssessmentModelMock.findOne.mockResolvedValueOnce(deploymentAssessment)
      ResponseModelMock.find.mockResolvedValueOnce([])

      await removeDeploymentAssessment({ dn: 'creator' }, 'da-id')

      expect(ResponseModelMock.deleteMany).toHaveBeenCalledWith({ parentId: { $in: [assessmentId] } }, undefined)
      expect(deploymentAssessment.delete).toHaveBeenCalledWith(undefined)
    })

    test('passes the transaction session through to every deletion', async () => {
      const { deploymentAssessment } = mockAssessmentWithChildren()
      const session = {} as any

      await removeDeploymentAssessment({ dn: 'creator' }, 'da-id', session)

      expect(ResponseModelMock.deleteMany).toHaveBeenCalledWith({ parentId: { $in: [assessmentId] } }, session)
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
    })
  })

  describe('searchDeploymentAssessments', () => {
    beforeEach(() => {
      repositoryMocks.findDeploymentAssessments.mockResolvedValue([])
      repositoryMocks.findLatestDecisionsByAssessmentIds.mockResolvedValue(new Map())
    })

    test('passes parameters to the repository and returns authorised results', async () => {
      const deploymentAssessments = [
        {
          id: 'assessment-one',
          schemaId: 'deployment-assessment-schema',
          name: 'Assessment One',
          draft: false,
          createdBy: 'creator',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]
      repositoryMocks.findDeploymentAssessments.mockResolvedValueOnce(deploymentAssessments)
      vi.mocked(authorisation.deploymentAssessments).mockResolvedValueOnce([{ success: true, id: 'assessment-one' }])

      const result = await searchDeploymentAssessments({ dn: 'creator' }, {})

      expect(repositoryMocks.findDeploymentAssessments).toHaveBeenCalledWith({})
      expect(authorisation.deploymentAssessments).toHaveBeenCalledWith(
        { dn: 'creator' },
        deploymentAssessments,
        'deployment_assessment:view',
      )
      expect(result).toStrictEqual([
        {
          id: 'assessment-one',
          schemaId: 'deployment-assessment-schema',
          name: 'Assessment One',
          draft: false,
          createdBy: 'creator',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
    })

    test('passes all filter params through to the repository', async () => {
      vi.mocked(authorisation.deploymentAssessments).mockResolvedValueOnce([])

      const searchParams = {
        schemaId: 'deployment-assessment-schema',
        modelIds: ['model-one', 'model-two'],
        riskOwners: 'user:risk-owner',
        createdBy: 'creator',
        createdAfter: '2026-01-01',
        createdBefore: '2026-01-31',
        draft: true,
        search: 'Assessment.*',
      }

      await searchDeploymentAssessments({ dn: 'creator' }, searchParams)

      expect(repositoryMocks.findDeploymentAssessments).toHaveBeenCalledWith(searchParams)
    })
  })
})
