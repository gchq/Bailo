import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SchemaSelect from 'src/schemas/SchemaSelect'
import { type EntryInterface, EntryKind, SchemaKind } from 'types/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  useGetSchemas: vi.fn(),
  useGetCurrentUser: vi.fn(),
  postFromSchema: vi.fn(),
  mutateEntry: vi.fn(),
  push: vi.fn(),
}))

vi.mock('actions/schema', () => ({
  useGetSchemas: mocks.useGetSchemas,
}))

vi.mock('actions/user', () => ({
  useGetCurrentUser: mocks.useGetCurrentUser,
}))

vi.mock('actions/entry', () => ({
  useGetEntry: () => ({ mutateEntry: mocks.mutateEntry }),
}))

vi.mock('actions/modelCard', () => ({
  postFromSchema: mocks.postFromSchema,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, isReady: true, replace: vi.fn(), push: mocks.push }),
}))

vi.mock('src/schemas/SchemaButton', () => ({
  default: ({ schema, onClick }: { schema: { id: string; name: string }; onClick: () => void }) => (
    <button onClick={onClick}>{`Select ${schema.name}`}</button>
  ),
}))

const schema = { id: 'test-schema', name: 'Test Schema', active: true }
const entry = { id: 'test-model', kind: EntryKind.MODEL } as EntryInterface
const forbiddenMessage = 'Forbidden: You do not have permission to update this model card.'

describe('SchemaSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useGetSchemas.mockReturnValue({ schemas: [schema], isSchemasLoading: false, isSchemasError: undefined })
    mocks.useGetCurrentUser.mockReturnValue({
      currentUser: { dn: 'user' },
      isCurrentUserLoading: false,
      isCurrentUserError: undefined,
    })
    mocks.mutateEntry.mockResolvedValue(undefined)
  })

  it('shows an error message when selecting a schema returns a 403', async () => {
    mocks.postFromSchema.mockResolvedValue({ status: 403, data: forbiddenMessage })

    render(<SchemaSelect schemaKind={SchemaKind.MODEL} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Test Schema' }))

    expect(await screen.findByText(forbiddenMessage)).toBeDefined()
    expect(mocks.postFromSchema).toHaveBeenCalledWith('test-model', 'test-schema')
    expect(mocks.mutateEntry).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('shows an error message when no response is received', async () => {
    mocks.postFromSchema.mockResolvedValue({ status: 503, data: 'No response received from server' })

    render(<SchemaSelect schemaKind={SchemaKind.MODEL} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Test Schema' }))

    expect(await screen.findByText('No response received from server')).toBeDefined()
  })

  it('shows an error message when the response has no status', async () => {
    mocks.postFromSchema.mockResolvedValue({ data: 'Unknown error' })

    render(<SchemaSelect schemaKind={SchemaKind.MODEL} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Test Schema' }))

    expect(await screen.findByText('Unknown error')).toBeDefined()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('shows a fallback error message when the response data is not a string', async () => {
    mocks.postFromSchema.mockResolvedValue({ status: 500, data: { unexpected: true } })

    render(<SchemaSelect schemaKind={SchemaKind.MODEL} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Test Schema' }))

    expect(await screen.findByText('Unable to set up the schema. Please try again.')).toBeDefined()
  })

  it('clears the previous error message when retrying', async () => {
    mocks.postFromSchema.mockResolvedValueOnce({ status: 403, data: forbiddenMessage })
    mocks.postFromSchema.mockResolvedValueOnce({ status: 200, data: { card: {} } })

    render(<SchemaSelect schemaKind={SchemaKind.MODEL} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Test Schema' }))
    expect(await screen.findByText(forbiddenMessage)).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Select Test Schema' }))

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/model/test-model'))
    expect(screen.queryByText(forbiddenMessage)).toBeNull()
  })

  it('updates the entry and redirects when selecting a schema succeeds', async () => {
    mocks.postFromSchema.mockResolvedValue({ status: 200, data: { card: {} } })

    render(<SchemaSelect schemaKind={SchemaKind.MODEL} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Test Schema' }))

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/model/test-model'))
    expect(mocks.mutateEntry).toHaveBeenCalled()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('redirects to the new access request page without setting up a schema', () => {
    render(<SchemaSelect schemaKind={SchemaKind.ACCESS_REQUEST} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Test Schema' }))

    expect(mocks.push).toHaveBeenCalledWith('/model/test-model/access-request/new?schemaId=test-schema')
    expect(mocks.postFromSchema).not.toHaveBeenCalled()
  })

  it('redirects to the new Deployment Assessment page without setting up a schema', () => {
    render(<SchemaSelect schemaKind={SchemaKind.DEPLOYMENT_ASSESSMENT} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select Test Schema' }))

    expect(mocks.push).toHaveBeenCalledWith('/deployment-assessments/new?schemaId=test-schema')
    expect(mocks.postFromSchema).not.toHaveBeenCalled()
  })
})
