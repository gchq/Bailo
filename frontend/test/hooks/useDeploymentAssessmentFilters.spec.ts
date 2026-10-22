import { statusToApiFilters } from 'src/hooks/useDeploymentAssessmentFilters'
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
