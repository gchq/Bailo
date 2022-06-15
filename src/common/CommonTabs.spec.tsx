/**
 * @jest-environment jsdom
 */

import CommonTabs from './CommonTabs'
import { render, screen, waitFor } from '@testing-library/react'

describe('CommonTabs', () => {
  const tabs = [
    {
      name: 'tab1',
    },
    {
      name: 'tab2',
    },
  ]

  it('renders an FileInput component', async () => {
    render(<CommonTabs tabs={tabs} tabName='test' />)

    await waitFor(async () => {
      expect(await screen.findByText('test #1')).not.toBeUndefined()
      expect(await screen.findByText('test #2')).not.toBeUndefined()
    })
  })
})
