import { render, screen } from '@testing-library/react'
import { useGetUiConfig } from 'actions/uiConfig'
import { describe, expect, it, vi } from 'vitest'

import CompareField from '../../src/common/CompareField'
import { CompareFieldState } from '../../src/hooks/useCompareField'

vi.mock('../../actions/uiConfig', () => ({
  useGetUiConfig: vi.fn(),
}))

const mockUiConfig: any = {
  uiConfig: {
    modelMirror: { import: { originalAnswerHeading: 'Original answer', additionalInfoHeading: 'Additional info' } },
  },
  isUiConfigLoading: false,
  isUiConfigError: false,
}

function makeCompare(overrides: Partial<CompareFieldState<unknown>> = {}): CompareFieldState<unknown> {
  return {
    mirroredState: undefined,
    compareFromState: undefined,
    compareFromMirroredState: undefined,
    inCompareMode: false,
    isMirroredModel: false,
    inMirroredCompare: false,
    editMode: false,
    ...overrides,
  }
}

describe('CompareField', () => {
  it('renders children in normal mode', () => {
    vi.mocked(useGetUiConfig).mockReturnValue(mockUiConfig)

    render(
      <CompareField id='root_field' label='Test Label' compare={makeCompare()} value='hello'>
        <span data-test='child'>Child Content</span>
      </CompareField>,
    )

    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByText('Test Label')).toBeDefined()
  })

  it('renders InlineDiff in non-mirrored compare mode and hides children', () => {
    vi.mocked(useGetUiConfig).mockReturnValue(mockUiConfig)

    render(
      <CompareField
        id='root_field'
        label='Test Label'
        compare={makeCompare({
          inCompareMode: true,
          isMirroredModel: false,
          compareFromState: 'old value',
        })}
        value='new value'
      >
        <span data-test='child'>Should not appear</span>
      </CompareField>,
    )

    expect(screen.queryByTestId('child')).toBeNull()
    expect(screen.getByText('old value')).toBeDefined()
    expect(screen.getByText('new value')).toBeDefined()
  })

  it('applies formatter to values in non-mirrored compare mode', () => {
    vi.mocked(useGetUiConfig).mockReturnValue(mockUiConfig)

    const formatter = (val: unknown) => (val ? 'YES' : 'NO')

    render(
      <CompareField
        id='root_field'
        label='Test Label'
        compare={makeCompare({
          inCompareMode: true,
          isMirroredModel: false,
          compareFromState: false,
        })}
        value={true}
        formatter={formatter}
      >
        <span>child</span>
      </CompareField>,
    )

    expect(screen.getByText('NO')).toBeDefined()
    expect(screen.getByText('YES')).toBeDefined()
  })

  it('falls back to mirroredState when compareFromState is undefined in non-mirrored compare', () => {
    vi.mocked(useGetUiConfig).mockReturnValue(mockUiConfig)

    render(
      <CompareField
        id='root_field'
        label='Test Label'
        compare={makeCompare({
          inCompareMode: true,
          isMirroredModel: false,
          compareFromState: undefined,
          mirroredState: 'mirrored fallback',
        })}
        value='current'
      >
        <span>child</span>
      </CompareField>,
    )

    expect(screen.getByText('mirrored fallback')).toBeDefined()
    expect(screen.getByText('current')).toBeDefined()
  })

  it('renders children in mirrored compare mode', () => {
    vi.mocked(useGetUiConfig).mockReturnValue(mockUiConfig)

    render(
      <CompareField
        id='root_field'
        label='Test Label'
        compare={makeCompare({
          inCompareMode: true,
          isMirroredModel: true,
          inMirroredCompare: true,
          mirroredState: 'mirrored-to',
          compareFromMirroredState: 'mirrored-from',
        })}
        value='local value'
        hasValue
      >
        <span data-test='child'>Child renders</span>
      </CompareField>,
    )

    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByText('mirrored-from')).toBeDefined()
    expect(screen.getByText('mirrored-to')).toBeDefined()
  })
})
