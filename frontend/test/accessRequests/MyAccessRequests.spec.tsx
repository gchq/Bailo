import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import MyAccessRequests from '../../src/accessRequests/MyAccessRequests'

vi.mock('actions/accessRequest', () => ({
  useGetAccessRequests: vi.fn(() => ({
    accessRequests: [
      {
        _id: 'request-1',
        id: 'request-1',
        modelId: 'model-123',
        schemaId: 'schema-1',
        deleted: false,
        metadata: { overview: { name: 'Research access', entities: ['user:test'] } },
        createdBy: 'user:test',
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-02T09:00:00.000Z',
      },
    ],
    isAccessRequestsLoading: false,
    isAccessRequestsError: undefined,
  })),
}))

vi.mock('actions/entry', () => ({
  useGetModel: vi.fn(() => ({
    entry: { id: 'model-123', name: 'Example model' },
    isEntryLoading: false,
    isEntryError: undefined,
  })),
}))

vi.mock('../../src/entry/model/accessRequests/AccessRequestDisplay', () => ({
  default: ({ accessRequest }) => <div>{accessRequest.metadata.overview.name}</div>,
}))

describe('MyAccessRequests', () => {
  it('shows the current user access request with a link to its model', () => {
    render(<MyAccessRequests />)

    expect(screen.getByText('Research access')).toBeDefined()
    const modelLink = screen.getByRole('link', { name: 'Example model' })
    expect(modelLink.getAttribute('href')).toBe('/model/model-123')
  })
})
