/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import LoadingBar from './LoadingBar'

describe('LoadingBar', () => {
  it('renders an LoadingBar component', async () => {
    render(<LoadingBar showLoadingBar loadingPercentage={50} />)

    await waitFor(async () => {
      expect(await screen.findByText('50%')).not.toBeUndefined()
    })
  })

  it('does not render a LoadingBar component', async () => {
    render(<LoadingBar showLoadingBar={false} loadingPercentage={50} />)

    await waitFor(async () => {
      expect(await screen.queryByText('50%')).toBeNull()
    })
  })
})
