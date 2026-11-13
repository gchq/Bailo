import { buildDeploymentAssessmentListHref, statusToApiFilters } from 'src/hooks/useDeploymentAssessmentFilters'
import { describe, expect, it } from 'vitest'

describe('statusToApiFilters', () => {
  it('filters to drafts', () => {
    expect(statusToApiFilters('draft')).toEqual({ draft: true })
  })

  it('filters to published assessments', () => {
    expect(statusToApiFilters('published')).toEqual({ draft: false })
  })

  it('does not filter when no status is selected', () => {
    expect(statusToApiFilters()).toEqual({})
  })
})

describe('buildDeploymentAssessmentListHref', () => {
  it('returns the plain list path when no filters are set', () => {
    expect(buildDeploymentAssessmentListHref({ modelIds: [] })).toBe('/deployment-assessments')
  })

  it('includes only the filters that are set', () => {
    expect(buildDeploymentAssessmentListHref({ search: 'abc', status: 'published', modelIds: ['m1', 'm2'] })).toBe(
      '/deployment-assessments?search=abc&status=published&modelIds=m1&modelIds=m2',
    )
  })
})
