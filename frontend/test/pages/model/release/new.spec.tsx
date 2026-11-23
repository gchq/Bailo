import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useGetModel } from 'actions/entry'
import { type CreateReleaseParams, postRelease } from 'actions/release'
import NewRelease from 'pages/model/[modelId]/release/new'
import { lightTheme } from 'src/theme'
import { testV2Model } from 'utils/test/testModels'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/router', () => ({
  useRouter: () => ({ query: { modelId: testV2Model.id }, push: vi.fn() }),
}))

vi.mock('actions/entry', () => ({ useGetModel: vi.fn() }))
vi.mock('actions/file', () => ({ postFileForModelId: vi.fn() }))
vi.mock('actions/release', () => ({ postRelease: vi.fn() }))

vi.mock('src/entry/model/releases/ReleaseForm', () => ({
  default: ({
    formData,
    onSemverChange,
    onReleaseNotesChange,
  }: {
    formData: { semver: string; releaseNotes: string }
    onSemverChange: (value: string) => void
    onReleaseNotesChange: (value: string) => void
  }) => (
    <>
      <input
        aria-label='Semantic version'
        value={formData.semver}
        onChange={(event) => onSemverChange(event.target.value)}
      />
      <input
        aria-label='Release notes'
        value={formData.releaseNotes}
        onChange={(event) => onReleaseNotesChange(event.target.value)}
      />
    </>
  ),
}))

function renderPageWithRequiredFields() {
  render(
    <ThemeProvider theme={lightTheme}>
      <NewRelease />
    </ThemeProvider>,
  )
  fireEvent.change(screen.getByLabelText('Semantic version'), { target: { value: '1.0.0' } })
  fireEvent.change(screen.getByLabelText('Release notes'), { target: { value: 'Some notes' } })
}

function lastReleaseRequest(): CreateReleaseParams {
  return vi.mocked(postRelease).mock.calls.at(-1)![0]
}

describe('NewRelease', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useGetModel).mockReturnValue({
      entry: testV2Model,
      isEntryLoading: false,
      isEntryError: undefined,
    } as unknown as ReturnType<typeof useGetModel>)
    vi.mocked(postRelease).mockResolvedValue({
      ok: true,
      json: async () => ({ release: { semver: '1.0.0' } }),
    } as Response)
  })

  // jsdom does not implement implicit form submission, so submitting the form directly stands in
  // for pressing Enter in a text field.
  it('does not create a release when the form is submitted by anything other than the buttons', async () => {
    renderPageWithRequiredFields()

    fireEvent.submit(screen.getByLabelText('Semantic version').closest('form')!)

    await waitFor(() => expect(postRelease).not.toHaveBeenCalled())
  })

  it('creates a draft release when the draft button is clicked', async () => {
    renderPageWithRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Draft release' }))

    await waitFor(() => expect(lastReleaseRequest().draft).toBe(true))
  })

  it('publishes rather than drafts when the publish button follows a failed draft attempt', async () => {
    vi.mocked(postRelease).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: { message: 'Release already exists' } }),
    } as Response)
    renderPageWithRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Draft release' }))
    await waitFor(() => expect(postRelease).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }))

    await waitFor(() => {
      expect(postRelease).toHaveBeenCalledTimes(2)
      expect(lastReleaseRequest().draft).toBe(false)
    })
  })
})
