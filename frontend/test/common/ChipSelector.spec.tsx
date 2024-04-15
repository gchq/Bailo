import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ChipSelector from '../../src/common/ChipSelector'

describe('ChipSelector', () => {
  it('when one chip is selected then the label should reflect this by displaying the same number of selected chips', async () => {
    render(
      <ChipSelector multiple tags={['cat', 'dog']} label='Pets' selectedTags={['cat']} onChange={() => undefined} />,
    )
    await waitFor(async () => {
      expect(await screen.findByText('Pets (1 selected)')).toBeDefined()
    })
  })

  it('when dog is selected then it should have the appropriate css class to display that has been selected', async () => {
    render(
      <ChipSelector multiple tags={['cat', 'dog']} label='Pets' selectedTags={['dog']} onChange={() => undefined} />,
    )
    const dogChipOption = await screen.findByTestId('chipOption-dog')
    const catChipOption = await screen.findByTestId('chipOption-cat')
    await waitFor(async () => {
      expect(dogChipOption.className.includes('MuiChip-clickableColorPrimary')).toBe(true)
      expect(catChipOption.className.includes('MuiChip-clickableColorDefault')).toBe(true)
    })
  })
})
