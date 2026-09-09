import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Decision, ResponseKind } from '../../src/models/Response.js'
import {
  findDeploymentAssessments,
  findLatestDecisionsByAssessmentIds,
} from '../../src/repositories/deploymentAssessment.js'
import { ReviewKind } from '../../src/types/enums.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

const DeploymentAssessmentModelMock = getTypedModelMock('DeploymentAssessmentModel')
const ReviewModelMock = getTypedModelMock('ReviewModel')

describe('repositories > deploymentAssessment', () => {
  describe('findDeploymentAssessments', () => {
    beforeEach(() => {
      const sort = vi.fn().mockResolvedValue([])
      DeploymentAssessmentModelMock.find.mockReturnValue({ sort })
    })

    test('returns all assessments when no filters are applied', async () => {
      const result = await findDeploymentAssessments({})

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({})
      expect(result).toStrictEqual([])
    })

    test('filters by schemaId', async () => {
      await findDeploymentAssessments({ schemaId: 'my-schema' })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({ schemaId: 'my-schema' })
    })

    test('filters by modelIds using $all', async () => {
      await findDeploymentAssessments({ modelIds: ['model-one', 'model-two'] })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({
        'metadata.overview.modelIds': { $all: ['model-one', 'model-two'] },
      })
    })

    test('ignores an empty modelIds array', async () => {
      await findDeploymentAssessments({ modelIds: [] })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({})
    })

    test('filters by riskOwner using $elemMatch', async () => {
      await findDeploymentAssessments({ riskOwner: 'user:risk-owner' })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({
        'metadata.overview.riskOwner': { $elemMatch: { $eq: 'user:risk-owner' } },
      })
    })

    test('filters by createdBy', async () => {
      await findDeploymentAssessments({ createdBy: 'creator' })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({ createdBy: 'creator' })
    })

    test('filters by draft status', async () => {
      await findDeploymentAssessments({ draft: true })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({ draft: true })
    })

    test('filters by search term using case-insensitive regex on name and justification', async () => {
      await findDeploymentAssessments({ search: 'Assessment.*' })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({
        $and: [
          {
            $or: [
              { name: { $regex: 'Assessment\\.\\*', $options: 'i' } },
              { 'metadata.overview.justification': { $regex: 'Assessment\\.\\*', $options: 'i' } },
            ],
          },
        ],
      })
    })

    test('filters by createdAfter only', async () => {
      await findDeploymentAssessments({ createdAfter: '2026-01-01' })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({
        createdAt: { $gte: new Date('2026-01-01T00:00:00.000Z') },
      })
    })

    test('filters by createdBefore only, advancing the boundary by one day', async () => {
      await findDeploymentAssessments({ createdBefore: '2026-01-31' })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({
        createdAt: { $lt: new Date('2026-02-01T00:00:00.000Z') },
      })
    })

    test('combines both createdAfter and createdBefore boundaries', async () => {
      await findDeploymentAssessments({ createdAfter: '2026-01-01', createdBefore: '2026-01-31' })

      expect(DeploymentAssessmentModelMock.find).toHaveBeenCalledWith({
        createdAt: {
          $gte: new Date('2026-01-01T00:00:00.000Z'),
          $lt: new Date('2026-02-01T00:00:00.000Z'),
        },
      })
    })

    test('sorts results with drafts first and most recently updated first', async () => {
      const sort = vi.fn().mockResolvedValue([])
      DeploymentAssessmentModelMock.find.mockReturnValueOnce({ sort })

      await findDeploymentAssessments({})

      expect(sort).toHaveBeenCalledWith({ draft: -1, updatedAt: -1 })
    })

    test('combines all filters', async () => {
      await findDeploymentAssessments({
        schemaId: 'deployment-assessment-schema',
        modelIds: ['model-one', 'model-two'],
        riskOwner: 'user:risk-owner',
        createdBy: 'creator',
        createdAfter: '2026-01-01',
        createdBefore: '2026-01-31',
        draft: true,
        search: 'Assessment.*',
      })

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
    })
  })

  describe('findLatestDecisionsByAssessmentIds', () => {
    test('returns an empty Map without hitting the database when given an empty array', async () => {
      const result = await findLatestDecisionsByAssessmentIds([])

      expect(ReviewModelMock.aggregate).not.toHaveBeenCalled()
      expect(result).toStrictEqual(new Map())
    })

    test('returns a Map keyed by assessment ID with the latest decision', async () => {
      ReviewModelMock.aggregate.mockResolvedValueOnce([
        { _id: 'assessment-one', decision: Decision.Approve },
        { _id: 'assessment-two', decision: Decision.Reject },
      ])

      const result = await findLatestDecisionsByAssessmentIds(['assessment-one', 'assessment-two'])

      expect(result).toStrictEqual(
        new Map([
          ['assessment-one', Decision.Approve],
          ['assessment-two', Decision.Reject],
        ]),
      )
    })

    test('maps an entry with no decision to undefined', async () => {
      ReviewModelMock.aggregate.mockResolvedValueOnce([{ _id: 'assessment-one', decision: undefined }])

      const result = await findLatestDecisionsByAssessmentIds(['assessment-one'])

      expect(result.get('assessment-one')).toBeUndefined()
    })

    test('runs the correct aggregate pipeline shape', async () => {
      ReviewModelMock.aggregate.mockResolvedValueOnce([])

      await findLatestDecisionsByAssessmentIds(['assessment-one'])

      expect(ReviewModelMock.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            deploymentAssessmentId: { $in: ['assessment-one'] },
            kind: ReviewKind.DeploymentAssessment,
          },
        },
        {
          $lookup: {
            from: 'v2_responses',
            let: { reviewId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$parentId', '$$reviewId'] },
                  kind: ResponseKind.Review,
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: 'latestResponse',
          },
        },
        {
          $unwind: {
            path: '$latestResponse',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $sort: { 'latestResponse.createdAt': -1 },
        },
        {
          $group: {
            _id: '$deploymentAssessmentId',
            decision: { $first: '$latestResponse.decision' },
          },
        },
      ])
    })
  })
})
