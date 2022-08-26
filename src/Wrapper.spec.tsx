/**
 * @jest-environment jsdom
 */

import ThemeProvider from '@mui/system/ThemeProvider'
import { render, screen, waitFor } from '@testing-library/react'
import { lightTheme } from './theme'
import Wrapper from './Wrapper'

describe('Wrapper', () => {
  it('renders a Wrapper component', async () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <Wrapper title='marketplace' page='/' />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('marketplace')).not.toBeUndefined()
    })
  })
})
