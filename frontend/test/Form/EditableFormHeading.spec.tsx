import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import EditableFormHeading from '../../src/Form/EditableFormHeading'

describe('EditableFormHeading', () => {
  it('when not in edit mode it displays the edit button with the correct text', async () => {
    render(
      <EditableFormHeading
        isEdit={false}
        heading='Test'
        isLoading={false}
        editButtonText='Edit Form'
        onEdit={() => undefined}
        onCancel={() => undefined}
        onSubmit={() => undefined}
      />,
    )
    await waitFor(async () => {
      expect(screen.findByTestId('editFormButton')).toBeDefined()
      expect(await screen.findByText('Edit Form')).toBeDefined()
      expect(screen.queryByTestId('cancelEditFormButton')).toBe(null)
      expect(screen.queryByTestId('saveEditFormButton')).toBe(null)
    })
  })

  it('when in edit mode it displays the save and cancel buttons and not the edit button', async () => {
    render(
      <EditableFormHeading
        isEdit={true}
        heading='Test'
        isLoading={false}
        editButtonText='Edit Form'
        onEdit={() => undefined}
        onCancel={() => undefined}
        onSubmit={() => undefined}
      />,
    )

    await waitFor(async () => {
      expect(screen.queryByTestId('editFormButton')).toBe(null)
      expect(await screen.findByTestId('cancelEditFormButton')).toBeDefined()
      expect(await screen.findByTestId('saveEditFormButton')).toBeDefined()
    })
  })
})
