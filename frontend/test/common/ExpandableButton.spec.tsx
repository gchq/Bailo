import Add from '@mui/icons-material/Add'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect } from 'vitest'

import ExpandableButton from '../../src/common/ExpandableButton'
import { doNothing } from '../../utils/test/testUtils'

describe('ExpandableButton', () => {
  it('button collapses when not hovered over', async () => {
    render(<ExpandableButton label='Click me' ariaLabel='' icon={<Add />} onClick={doNothing} />)

    await waitFor(async () => {
      expect(await screen.findByTestId('expandableButton')).toBeDefined()
      expect(screen.queryByTestId('expandedButtonContent')).toBeNull()
      expect(await screen.findByTestId('collapsedButtonContent')).toBeDefined()
      expect(screen.queryByText('Click me')).toBeNull()
    })
  })

  it('button expands when hovered over', async () => {
    render(<ExpandableButton label='Click me' ariaLabel='' icon={<Add />} onClick={doNothing} />)

    fireEvent.mouseEnter(await screen.findByTestId('expandableButton'))

    await waitFor(async () => {
      expect(await screen.findByTestId('expandableButton')).toBeDefined()
      expect(await screen.findByTestId('expandedButtonContent')).toBeDefined()
      expect(screen.queryByTestId('collapsedButtonContent')).toBeNull()
      expect(await screen.findByText('Click me')).toBeDefined()
    })
  })
})
