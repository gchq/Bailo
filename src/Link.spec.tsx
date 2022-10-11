/**
 * @jest-environment jsdom
 */

import { render, waitFor } from '@testing-library/react'

describe('Link', () => {
  it('renders a Link component', async () => {
    render(
      <div>
        <div>Click here</div>
      </div>
    )

    await waitFor(async () => {
      // Need to expand on this and find way to test getting href attribute of the anchor element rendered
      // expect(await screen.findByText('Click here')).not.toBeUndefined()
    })
  })
})
