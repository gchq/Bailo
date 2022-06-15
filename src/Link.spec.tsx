/**
 * @jest-environment jsdom
 */

import Link from './Link'
import { render, screen, waitFor } from '@testing-library/react'
import * as router from 'next/router'

describe('Link', () => {
  it('renders a Link component', async () => {
    const url = 'example_url'
    const mockedRouter: any = {
      pathName: 'test-path',
      prefetch: () => {},
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
      //expect(await screen.findByText('Click here')).not.toBeUndefined()
    })
  })
})
