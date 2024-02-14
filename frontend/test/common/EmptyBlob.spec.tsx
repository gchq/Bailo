import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import EmptyBlob from '../../src/common/EmptyBlob'

describe('EmptyBlob', () => {
  it('displays an image with text when rendered', async () => {
    render(<EmptyBlob text='Test' />)

    await waitFor(async () => {
      expect(await screen.findByTestId('emptyBlobImage')).toBeDefined()
      expect(await screen.findByText('Test')).toBeDefined()
    })
  })
})
