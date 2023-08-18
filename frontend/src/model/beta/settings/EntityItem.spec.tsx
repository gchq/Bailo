import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import EntityItem from './EntityItem'

describe('EntityItem', () => {
  const entity = { entity: 'testuser', roles: ['consumer'] }
  const accessList = [entity]

  it('renders a EntityItem component', async () => {
    render(<EntityItem entity={entity} accessList={accessList} setAccessList={() => console.log(entity.entity)} />)

    await waitFor(async () => {
      expect(await screen.findByText('testuser')).not.toBeUndefined()
    })
  })
})
