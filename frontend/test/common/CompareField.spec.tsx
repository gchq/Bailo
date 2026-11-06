import { render, screen } from '@testing-library/react'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { describe, expect, it } from 'vitest'

import CompareField from '../../src/common/CompareField'
import { CompareFieldState } from '../../src/hooks/useCompareField'

const mockUiConfig: any = {
  modelMirror: {
    import: {
      originalAnswerHeading: 'Original answer',
      additionalInfoHeading: 'Additional info',
    },
  },
}

function renderWithUiConfig(ui: React.ReactNode) {
  return render(<UiConfigContext.Provider value={mockUiConfig}>{ui}</UiConfigContext.Provider>)
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
    renderWithUiConfig(
      <CompareField id='root_field' label='Test Label' compare={makeCompare()} value='hello'>
        <span data-test='child'>Child Content</span>
      </CompareField>,
    )

    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByText('Test Label')).toBeDefined()
  })

  it('renders InlineDiff in non-mirrored compare mode and hides children', () => {
    renderWithUiConfig(
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
        <span data-testid='child'>Should not appear</span>
      </CompareField>,
    )

    expect(screen.queryByTestId('child')).toBeNull()
    expect(document.querySelector('del')?.textContent).toContain('old')
    expect(document.querySelector('ins')?.textContent).toContain('new')
    expect(document.body.textContent).toContain('value')
  })

  it('applies formatter to values in non-mirrored compare mode', () => {
    const formatter = (val: unknown) => (val ? 'YES' : 'NO')

    renderWithUiConfig(
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
    renderWithUiConfig(
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

  it('diffs numeric values in non-mirrored compare mode without a formatter', () => {
    const { container } = renderWithUiConfig(
      <CompareField
        id='root_field'
        label='Test Label'
        compare={makeCompare({
          inCompareMode: true,
          isMirroredModel: false,
          compareFromState: 0.5,
        })}
        value={0.75}
      >
        <span>child</span>
      </CompareField>,
    )

    expect(container.querySelector('del')?.textContent).toContain('5')
    expect(container.querySelector('ins')?.textContent).toContain('75')
  })

  describe('mirrored compare mode', () => {
    const mirroredCompare = (overrides: Partial<CompareFieldState<unknown>> = {}) =>
      makeCompare({ inCompareMode: true, isMirroredModel: true, inMirroredCompare: true, ...overrides })

    function getAdditionalInformation() {
      return screen.getByText('Additional info').parentElement as HTMLElement
    }

    it('diffs the original answer and the additional information instead of rendering children', () => {
      renderWithUiConfig(
        <CompareField
          id='root_field'
          label='Test Label'
          compare={mirroredCompare({
            compareFromMirroredState: 'original old',
            mirroredState: 'original new',
            compareFromState: 'extra old',
          })}
          value='extra new'
        >
          <span data-test='child'>Should not appear</span>
        </CompareField>,
      )

      const additionalInformation = getAdditionalInformation()

      expect(screen.queryByTestId('child')).toBeNull()
      expect(document.querySelectorAll('del')).toHaveLength(2)
      expect(document.querySelectorAll('ins')).toHaveLength(2)
      expect(additionalInformation.querySelector('del')?.textContent).toContain('old')
      expect(additionalInformation.querySelector('ins')?.textContent).toContain('new')
      expect(additionalInformation.textContent).not.toContain('original')
    })

    it('shows additional information that was removed in the newer version', () => {
      renderWithUiConfig(
        <CompareField
          id='root_field'
          label='Test Label'
          compare={mirroredCompare({
            mirroredState: 'same',
            compareFromMirroredState: 'same',
            compareFromState: 'gone',
          })}
          value=''
        >
          <span>child</span>
        </CompareField>,
      )

      const additionalInformation = getAdditionalInformation()

      expect(additionalInformation.querySelector('del')?.textContent).toContain('gone')
      expect(additionalInformation.querySelector('ins')?.textContent).toContain('Unanswered')
    })

    it('diffs a false answer using the formatter', () => {
      renderWithUiConfig(
        <CompareField
          id='root_field'
          label='Test Label'
          compare={mirroredCompare({ mirroredState: true, compareFromMirroredState: true, compareFromState: true })}
          value={false}
          formatter={(val) => (val === undefined ? undefined : val ? 'Yes' : 'No')}
        >
          <span>child</span>
        </CompareField>,
      )

      const additionalInformation = getAdditionalInformation()

      expect(additionalInformation.querySelector('del')?.textContent).toContain('Yes')
      expect(additionalInformation.querySelector('ins')?.textContent).toContain('No')
    })

    it('hides the additional information section when neither version has any', () => {
      renderWithUiConfig(
        <CompareField
          id='root_field'
          label='Test Label'
          compare={mirroredCompare({ mirroredState: 'new', compareFromMirroredState: 'old' })}
          value=''
        >
          <span>child</span>
        </CompareField>,
      )

      expect(screen.queryByText('Additional info')).toBeNull()
      expect(document.querySelector('del')?.textContent).toContain('old')
      expect(document.querySelector('ins')?.textContent).toContain('new')
    })
  })
})
