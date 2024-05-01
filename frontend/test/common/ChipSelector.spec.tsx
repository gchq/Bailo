import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ChipSelector from '../../src/common/ChipSelector'

describe('ChipSelector', () => {
  it('when dog is selected then it should have the appropriate css class to display that has been selected', async () => {
    render(
      <ChipSelector
        multiple
        options={['cat', 'dog']}
        label='Pets'
        selectedChips={['dog']}
        onChange={() => undefined}
      />,
    )
    const dogChipOption = await screen.findByTestId('chipOption-dog')
    const catChipOption = await screen.findByTestId('chipOption-cat')
    await waitFor(async () => {
      expect(dogChipOption.className.includes('MuiChip-clickableColorSecondary')).toBe(true)
      expect(catChipOption.className.includes('MuiChip-clickableColorDefault')).toBe(true)
    })
  })
})
