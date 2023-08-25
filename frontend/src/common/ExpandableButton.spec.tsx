import Add from '@mui/icons-material/Add'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect } from 'vitest'

import { doNothing } from '../../utils/test/testUtils'
import ExpandableButton from './ExpandableButton'

describe('ExpandableButton', () => {
  it('renders an ExpandableButton component where you cannot view the label text', async () => {
    render(<ExpandableButton label='Click me' ariaLabel='' icon={<Add />} onClick={doNothing} />)

    await waitFor(async () => {
      const expandableButton = screen.queryByTestId('expandableButton')
      expect(expandableButton).not.toBeUndefined()
      expect(screen.queryByText('Click me')).toBeNull()
    })
  })

  it('renders an ExpandableButton component that shows the label on hover', async () => {
    render(<ExpandableButton label='Click me' ariaLabel='' icon={<Add />} onClick={doNothing} />)

    fireEvent.mouseEnter(await screen.findByTestId('expandableButton'))

    await waitFor(async () => {
      const expandableButton = screen.queryByTestId('expandableButton')
      expect(expandableButton).not.toBeUndefined()
      expect(await screen.findByText('Click me')).not.toBeUndefined()
    })
  })
})
