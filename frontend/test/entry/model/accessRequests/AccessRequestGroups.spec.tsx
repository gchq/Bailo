import { ThemeProvider } from '@mui/material/styles'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { postAccessRequest, postAccessRequestGroup, useGetAccessRequestGroup } from 'actions/accessRequest'
import { useGetModel, useListEntries } from 'actions/entry'
import { useGetSchema } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import NewAccessRequest from 'pages/model/[modelId]/access-request/new'
import { ReactNode } from 'react'
import AccessRequestGroupLinks from 'src/entry/model/accessRequests/AccessRequestGroupLinks'
import AccessRequestModels from 'src/entry/model/accessRequests/AccessRequestModels'
import { lightTheme } from 'src/theme'
import { AccessRequestInterface } from 'types/types'
import { getStepsData } from 'utils/formUtils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('actions/accessRequest', () => ({
  postAccessRequest: vi.fn(),
  postAccessRequestGroup: vi.fn(),
  useGetAccessRequestGroup: vi.fn(),
}))
vi.mock('actions/entry', () => ({ useGetModel: vi.fn(), useListEntries: vi.fn() }))
vi.mock('actions/schema', () => ({ useGetSchema: vi.fn() }))
vi.mock('actions/user', () => ({ useGetCurrentUser: vi.fn() }))
vi.mock('next/router', () => ({ useRouter: vi.fn() }))
vi.mock('src/Form/JsonSchemaForm', () => ({ default: () => <div>Request form</div> }))
vi.mock('utils/formUtils', () => ({
  getStepsFromSchema: () => [],
  getStepsData: vi.fn(),
  setStepValidate: vi.fn(),
  validateForm: () => true,
}))

const push = vi.fn()
const entries = [
  { id: 'first', name: 'First model' },
  { id: 'second', name: 'Second model' },
]
const first = { id: 'request-first', modelId: 'first', groupId: 'group' } as AccessRequestInterface
const second = { id: 'request-second', modelId: 'second', groupId: 'group' } as AccessRequestInterface
const data = { overview: { name: 'Shared purpose', entities: ['user:requester'] } }
function show(component: ReactNode) {
  return render(<ThemeProvider theme={lightTheme}>{component}</ThemeProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useRouter).mockReturnValue({ query: { modelId: 'first', schemaId: 'schema' }, push } as any)
  vi.mocked(useListEntries).mockReturnValue({ entries, isEntriesLoading: false, isEntriesError: undefined } as any)
  vi.mocked(useGetModel).mockReturnValue({ entry: { id: 'first', card: {} }, isEntryLoading: false } as any)
  vi.mocked(useGetSchema).mockReturnValue({ schema: { id: 'schema' }, isSchemaLoading: false } as any)
  vi.mocked(useGetCurrentUser).mockReturnValue({ currentUser: { dn: 'requester' }, isCurrentUserLoading: false } as any)
  vi.mocked(getStepsData).mockReturnValue(data)
  vi.mocked(useGetAccessRequestGroup).mockReturnValue({
    accessRequests: [first, second],
    isLoading: false,
    error: undefined,
  })
  vi.mocked(postAccessRequest).mockResolvedValue(
    new Response(JSON.stringify({ accessRequest: first }), { status: 200 }),
  )
  vi.mocked(postAccessRequestGroup).mockResolvedValue(
    new Response(JSON.stringify({ groupId: 'group', accessRequests: [first, second], failedModelIds: [] }), {
      status: 200,
    }),
  )
})
afterEach(cleanup)

function addSecondModel() {
  fireEvent.mouseDown(screen.getByRole('combobox'))
  fireEvent.click(screen.getByRole('option', { name: 'Second model' }))
}

describe('additional model selector', () => {
  test('excludes the current model and returns additional IDs', () => {
    const changed = vi.fn()
    show(<AccessRequestModels modelId='first' selectedIds={[]} onChange={changed} />)
    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(screen.queryByRole('option', { name: 'First model' })).toBeNull()
    fireEvent.click(screen.getByRole('option', { name: 'Second model' }))
    expect(changed).toHaveBeenCalledWith(['second'])
  })

  test('does not submit a remote peer model to the local endpoint', () => {
    vi.mocked(useListEntries).mockReturnValue({
      entries: [...entries, { id: 'remote', name: 'Remote model', peerId: 'peer' }],
      isEntriesLoading: false,
    } as any)
    show(<AccessRequestModels modelId='first' selectedIds={[]} onChange={vi.fn()} />)
    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(screen.queryByRole('option', { name: 'Remote model' })).toBeNull()
    expect(screen.getByRole('option', { name: 'Second model' })).toBeDefined()
  })

  test('limits the group to nineteen additional models', () => {
    const options = Array.from({ length: 20 }, (_, index) => ({ id: String(index), name: `Model ${index}` }))
    vi.mocked(useListEntries).mockReturnValue({ entries: options, isEntriesLoading: false } as any)
    show(
      <AccessRequestModels
        modelId='first'
        selectedIds={options.slice(0, 19).map((entry) => entry.id)}
        onChange={vi.fn()}
      />,
    )
    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(screen.getByRole('option', { name: 'Model 19' }).getAttribute('aria-disabled')).toBe('true')
  })

  test('disables additional selection while entries are loading', () => {
    vi.mocked(useListEntries).mockReturnValue({ entries: [], isEntriesLoading: true } as any)
    show(<AccessRequestModels modelId='first' selectedIds={[]} onChange={vi.fn()} />)
    expect((screen.getByRole('combobox') as HTMLInputElement).disabled).toBe(true)
  })

  test('shows an error without preventing single-model requests', () => {
    vi.mocked(useListEntries).mockReturnValue({ entries: [], isEntriesLoading: false, isEntriesError: {} } as any)
    show(<AccessRequestModels modelId='first' selectedIds={[]} onChange={vi.fn()} />)
    expect(screen.getByText(/You can still request access to this model/)).toBeDefined()
  })
})

describe('group links', () => {
  test('shows other visible requests, excluding the current request', () => {
    show(<AccessRequestGroupLinks accessRequest={first} />)
    expect(screen.getByRole('link', { name: 'Request for second' }).getAttribute('href')).toBe(
      '/model/second/access-request/request-second',
    )
    expect(screen.queryByRole('link', { name: 'Request for first' })).toBeNull()
    expect(screen.getByText('Grouped request')).toBeDefined()
  })

  test('does not imply how many inaccessible requests exist', () => {
    vi.mocked(useGetAccessRequestGroup).mockReturnValue({ accessRequests: [first], isLoading: false, error: undefined })
    show(<AccessRequestGroupLinks accessRequest={first} />)
    expect(screen.getByText('No other requests in this group are visible to you.')).toBeDefined()
    expect(screen.queryByRole('link')).toBeNull()
  })

  test('leaves legacy requests unchanged', () => {
    const { container } = show(<AccessRequestGroupLinks accessRequest={{ ...first, groupId: undefined }} />)
    expect(container.textContent).toBe('')
  })

  test('reports errors without calling a failed group empty', () => {
    vi.mocked(useGetAccessRequestGroup).mockReturnValue({ accessRequests: [], isLoading: false, error: {} as any })
    show(<AccessRequestGroupLinks accessRequest={first} />)
    expect(screen.getByText('Related access requests could not be loaded.')).toBeDefined()
    expect(screen.queryByText('No other requests in this group are visible to you.')).toBeNull()
  })
})

describe('grouped request submission', () => {
  test('preserves single-model submission and navigation', async () => {
    show(<NewAccessRequest />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(postAccessRequest).toHaveBeenCalledWith('first', 'schema', data))
    expect(postAccessRequestGroup).not.toHaveBeenCalled()
    await waitFor(() => expect(push).toHaveBeenCalledWith('/model/first/access-request/request-first'))
  })

  test('submits one group and displays all created links', async () => {
    show(<NewAccessRequest />)
    addSecondModel()
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(postAccessRequestGroup).toHaveBeenCalledWith(['first', 'second'], 'schema', data))
    expect(postAccessRequest).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('link', { name: 'View request for second' })).toBeDefined())
    expect((screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement).disabled).toBe(true)
    expect(push).not.toHaveBeenCalled()
  })

  test('preserves partial successes and prevents a whole-group resubmission', async () => {
    vi.mocked(postAccessRequestGroup).mockResolvedValue(
      new Response(JSON.stringify({ groupId: 'group', accessRequests: [first], failedModelIds: ['second'] }), {
        status: 200,
      }),
    )
    show(<NewAccessRequest />)
    addSecondModel()
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(screen.getByText(/No request was created for: second/)).toBeDefined())
    expect(screen.getByRole('link', { name: 'View request for first' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(postAccessRequestGroup).toHaveBeenCalledTimes(1)
  })

  test('handles an uncertain network outcome without claiming failure or success', async () => {
    vi.mocked(postAccessRequestGroup).mockRejectedValue(new Error('Connection lost'))
    show(<NewAccessRequest />)
    addSecondModel()
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(screen.getByText(/Check your existing access requests/)).toBeDefined())
    expect(push).not.toHaveBeenCalled()
    expect(screen.queryByText('Access request results')).toBeNull()
  })
})
