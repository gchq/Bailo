import { MongoServerError } from 'mongodb'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import authentication from '../../src/connectors/authentication/index.js'
import { EntryKind, EntryVisibility } from '../../src/models/Model.js'
import { createDeploymentAssessment } from '../../src/services/deploymentAssessment.js'
import { SchemaKind } from '../../src/types/enums.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/authentication/index.js', () => ({
  default: { getUserInformation: vi.fn() },
}))

const idMocks = vi.hoisted(() => ({ convertStringToId: vi.fn(() => 'assessment-abc123') }))
vi.mock('../../src/utils/id.js', () => idMocks)

const schemaMocks = vi.hoisted(() => ({
  getSchemaById: vi.fn(),
  validateContentAgainstSchema: vi.fn(),
}))
vi.mock('../../src/services/schema.js', () => schemaMocks)

const DeploymentAssessmentModelMock = getTypedModelMock('DeploymentAssessmentModel')
const ModelModelMock = getTypedModelMock('ModelModel')

const params = {
  schemaId: 'deployment-assessment-schema',
  metadata: {
    overview: {
      name: 'Assessment',
      riskOwner: 'user:risk-owner',
      justification: 'Owns the deployment risk.',
      models: ['model-one'],
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
}

describe('services > deploymentAssessment', () => {
  beforeEach(() => {
    vi.mocked(authentication.getUserInformation).mockResolvedValue({ name: 'Risk Owner' })
    schemaMocks.getSchemaById.mockResolvedValue({ kind: SchemaKind.DeploymentAssessment, hidden: false })
    schemaMocks.validateContentAgainstSchema.mockResolvedValue({ valid: true, errors: [] })
    ModelModelMock.find.mockResolvedValue([liveModel])
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
    [{ ...liveModel, kind: EntryKind.DataCard }, 'One or more models could not be found.'],
    [{ ...liveModel, visibility: EntryVisibility.Private }, 'Deployment assessments can only use public models.'],
    [{ ...liveModel, state: 'Review' }, 'Deployment assessments can only use production models.'],
  ])('rejects an ineligible model', async (model, message) => {
    ModelModelMock.find.mockResolvedValueOnce([model])

    await expect(createDeploymentAssessment({ dn: 'creator' }, { ...params, draft: true })).rejects.toThrow(message)
    expect(DeploymentAssessmentModelMock).not.toHaveBeenCalled()
  })

  test('returns a conflict when the generated ID already exists', async () => {
    const mongoError = new MongoServerError({})
    mongoError.code = 11000
    DeploymentAssessmentModelMock.save.mockRejectedValueOnce(mongoError)

    await expect(createDeploymentAssessment({ dn: 'creator' }, params)).rejects.toMatchObject({ code: 409 })
  })
})
