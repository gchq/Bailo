/**
 * @jest-environment jsdom
 */

import { render, waitFor } from '@testing-library/react'
import * as router from 'next/router'

describe('Link', () => {
  it('renders a Link component', async () => {
    const url = 'example_url'
    const mockedRouter: any = {
      pathName: 'test-path',
      prefetch: () => {
        /* do nothing */
      },
    }

    const mockRouter = jest.spyOn(router, 'useRouter')
    mockRouter.mockReturnValue(mockedRouter)

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
