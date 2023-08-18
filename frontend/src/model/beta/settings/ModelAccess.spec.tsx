import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ModelVisibility } from '../../../../types/v2/types'
import ModelAccess from './ModelAccess'

describe('EntityItem', () => {
  it('renders a ModelAccesss component', async () => {
    const model = {
      id: 'modelid',
      name: 'test-model',
      description: 'test model',
      visibility: ModelVisibility.Public,
      collaborators: [
        {
          entity: 'test-user',
          roles: ['owner'],
        },
        {
          entity: 'test-user2',
          roles: ['owner'],
        },
      ],
    }

    render(<ModelAccess model={model} />)

    await waitFor(async () => {
      expect(await screen.findByText('test-user')).not.toBeUndefined()
      expect(await screen.findByText('test-user2')).not.toBeUndefined()

      expect(await (await screen.findAllByTestId('accesslistAutoselect')).length).toBe(2)
    })
  })
})
