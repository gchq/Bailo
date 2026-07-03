import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Banner from '../src/Banner'
import UiConfigContext from '../src/contexts/uiConfigContext'

describe('Banner', () => {
  it('renders a Banner component', async () => {
    const mockedConfig: any = {
      banner: {
        enabled: true,
        text: 'TEST',
        colour: 'blue',
      },
    }

    render(
      <UiConfigContext.Provider value={mockedConfig}>
        <Banner />
      </UiConfigContext.Provider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('TEST')).not.toBeUndefined()
    })
  })
})
