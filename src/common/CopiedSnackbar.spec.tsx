/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import CopiedSnackbar from './CopiedSnackbar'

describe('CopiedSnackbar', () => {
  it('renders an CopiedSnackbar component', async () => {
    let openSnackbar = true
    const setOpenSnackbar = (newVal) => {
      openSnackbar = newVal
    }
    render(<CopiedSnackbar {...{ openSnackbar, setOpenSnackbar }} />)

    await waitFor(async () => {
      expect(await screen.findByText('Copied to Clipboard')).not.toBeUndefined()
    })
  })

  it('does not render the snackbar', async () => {
    let openSnackbar = false
    const setOpenSnackbar = (newVal) => {
      openSnackbar = newVal
    }
    render(<CopiedSnackbar {...{ openSnackbar, setOpenSnackbar }} />)

    await waitFor(async () => {
      expect(await screen.queryByText('Copied to Clipboard')).toBeNull()
    })
  })
})
