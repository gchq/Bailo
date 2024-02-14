import Box from '@mui/material/Box'
import { render, screen, waitFor } from '@testing-library/react'
import { SnackbarProvider } from 'notistack'
import React from 'react'
import { describe, expect, it } from 'vitest'

import useNotification from './useNotification'

describe('Snackbar', () => {
  function TestComponent() {
    const sendNotification = useNotification()
    React.useEffect(() => {
      sendNotification({ variant: 'success', msg: 'Notification message' })
    }, [sendNotification])

    return <Box>test</Box>
  }

  it('renders a Snackbar component', async () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>,
    )

    await waitFor(async () => {
      expect(await screen.findByText('Notification message')).not.toBeUndefined()
    })
  })
})
