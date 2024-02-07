import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { useGetUiConfig } from 'actions/uiConfig'
import { useGetCurrentUser } from 'actions/user'
import mockRouter from 'next-router-mock'
import { SideNavigationProps } from 'src/wrapper/SideNavigation'
import { TopNavigationProps } from 'src/wrapper/TopNavigation'
import { describe, expect, it, vi } from 'vitest'

import { lightTheme } from '../theme'
import DocsWrapper from './DocsWrapper'

vi.mock('actions/uiConfig', () => ({
  useGetUiConfig: vi.fn(),
}))

vi.mock('actions/user', () => ({
  useGetCurrentUser: vi.fn(),
}))

vi.mock('src/wrapper/TopNavigation', () => ({ default: (_props: TopNavigationProps) => <></> }))
vi.mock('src/wrapper/SideNavigation', () => ({ default: (_props: SideNavigationProps) => <></> }))

describe('DocsWrapper', () => {
  it('renders a DocsWrapper component', async () => {
    const mockedConfig: any = {
      uiConfig: {
        banner: {
          enabled: true,
          text: 'TEST',
          colour: 'blue',
        },
      },
      isUiConfigLoading: false,
      isUiConfigError: false,
    }
    const mockedCurrentUser: any = {
      currentUser: {
        dn: 'test',
      },
      isCurrentUserLoading: false,
      isCurrentUserError: false,
    }
    vi.mocked(useGetUiConfig).mockReturnValue(mockedConfig)
    vi.mocked(useGetCurrentUser).mockReturnValue(mockedCurrentUser)
    mockRouter.push('/docs')

    render(
      <ThemeProvider theme={lightTheme}>
        <DocsWrapper />
      </ThemeProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Getting Started')).toBeDefined()
    })
  })
})
