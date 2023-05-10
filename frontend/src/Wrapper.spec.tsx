import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { describe, expect } from 'vitest'

import { lightTheme } from './theme'
import Wrapper from './Wrapper'

describe('Wrapper', () => {
  it('renders a Wrapper component', async () => {
    mockRouter.push('/')

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
