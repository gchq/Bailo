import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { DraftBanner } from 'src/entry/model/releases/DraftBanner'
import { lightTheme } from 'src/theme'
import { describe, expect, it, vi } from 'vitest'

function renderDraftBanner(onBeforePublish?: () => boolean) {
  return render(
    <ThemeProvider theme={lightTheme}>
      <DraftBanner
        text='This is a draft deployment assessment'
        draft
        showButton
        dialogTitle='Publish Deployment Assessment'
        dialogMessage='Are you sure you want to publish this Deployment Assessment? This decision is irreversible.'
        disableButton={false}
        isLoading={false}
        handlePublish={vi.fn()}
        setErrorMessage={vi.fn()}
        onBeforePublish={onBeforePublish}
      />
    </ThemeProvider>,
  )
}

describe('DraftBanner', () => {
  it('does not open the confirmation dialogue when onBeforePublish returns false', () => {
    renderDraftBanner(() => false)

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(screen.queryByText('Publish Deployment Assessment')).toBeNull()
  })

  it('opens the confirmation dialogue with the supplied message when onBeforePublish returns true', async () => {
    renderDraftBanner(() => true)

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(await screen.findByText('Publish Deployment Assessment')).toBeDefined()
    expect(
      await screen.findByText(
        'Are you sure you want to publish this Deployment Assessment? This decision is irreversible.',
      ),
    ).toBeDefined()
  })

  it('opens the confirmation dialogue when no onBeforePublish is supplied', async () => {
    renderDraftBanner()

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(await screen.findByText('Publish Deployment Assessment')).toBeDefined()
  })
})
