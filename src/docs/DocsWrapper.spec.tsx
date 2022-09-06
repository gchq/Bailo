/**
 * @jest-environment jsdom
 */

import { ThemeProvider } from '@mui/system'
import { render, screen, waitFor } from '@testing-library/react'
import * as router from 'next/router'
import { lightTheme } from '../theme'
import DocsWrapper from './DocsWrapper'

describe('DocsWrapper', () => {
  it('renders a DocsWrapper component', async () => {
    const mockedRouter: any = {
      pathname: 'test-path',
      prefetch: () => {
        /* do nothing */
      },
    }

    const mockRouter = jest.spyOn(router, 'useRouter')
    mockRouter.mockReturnValue(mockedRouter)

    render(
      <ThemeProvider theme={lightTheme}>
        <DocsWrapper />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Documentation')).toBeDefined()
    })
  })
})
