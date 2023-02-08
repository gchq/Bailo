/**
 * @jest-environment jsdom
 */

import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { mockNextUseRouter } from '../utils/testUtils.js'
import { lightTheme } from './theme.js'
import Wrapper from './Wrapper.js'

describe('Wrapper', () => {
  it('renders a Wrapper component', async () => {
    mockNextUseRouter({ pathname: '/' })

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
