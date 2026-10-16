import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { useGetFilesForModel } from 'actions/file'
import { useGetEntryCardRevisions } from 'actions/modelCard'
import { useGetReleasesForModelId } from 'actions/release'
import UiConfigContext from 'src/contexts/uiConfigContext'
import ReleaseForm, { ReleaseFormData } from 'src/entry/model/releases/ReleaseForm'
import { lightTheme } from 'src/theme'
import { testUiConfig, testV2Model } from 'utils/test/testModels'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('actions/file', () => ({
  useGetFilesForModel: vi.fn(),
}))

vi.mock('actions/release', () => ({
  useGetReleasesForModelId: vi.fn(),
}))

vi.mock('actions/modelCard', () => ({
  useGetEntryCardRevisions: vi.fn(),
}))

vi.mock('src/common/RichTextEditor.tsx', () => ({ default: () => <></> }))
vi.mock('src/entry/model/ModelImageList.tsx', () => ({ default: () => <></> }))

const emptyFormData: ReleaseFormData = {
  semver: '',
  releaseNotes: '',
  isMinorRelease: false,
  files: [],
  imageList: [],
  modelCardVersion: 1,
}

function mockFilesHook(overrides: Partial<ReturnType<typeof useGetFilesForModel>>) {
  vi.mocked(useGetFilesForModel).mockReturnValue({
    files: [],
    isFilesLoading: false,
    isFilesError: undefined,
    mutateFiles: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useGetFilesForModel>)
}

function renderReleaseForm() {
  return render(
    <ThemeProvider theme={lightTheme}>
      <UiConfigContext.Provider value={testUiConfig}>
        <ReleaseForm
          editable
          isEdit
          model={testV2Model}
          formData={emptyFormData}
          onSemverChange={vi.fn()}
          onReleaseNotesChange={vi.fn()}
          onMinorReleaseChange={vi.fn()}
          onFilesChange={vi.fn()}
          onModelCardVersionChange={vi.fn()}
          onImageListChange={vi.fn()}
          onRegistryError={vi.fn()}
        />
      </UiConfigContext.Provider>
    </ThemeProvider>,
  )
}

describe('ReleaseForm', () => {
  beforeEach(() => {
    vi.mocked(useGetReleasesForModelId).mockReturnValue({
      releases: [],
      isReleasesLoading: false,
      isReleasesError: undefined,
      mutateReleases: vi.fn(),
    } as unknown as ReturnType<typeof useGetReleasesForModelId>)
    vi.mocked(useGetEntryCardRevisions).mockReturnValue({
      entryCardRevisions: [],
      isEntryCardRevisionsLoading: false,
      isEntryCardRevisionsError: undefined,
    } as unknown as ReturnType<typeof useGetEntryCardRevisions>)
    mockFilesHook({})
  })

  it('surfaces the API error message when the model files cannot be fetched', async () => {
    mockFilesHook({
      isFilesError: { info: { message: 'Unable to communicate with the file store' } },
    } as Partial<ReturnType<typeof useGetFilesForModel>>)

    renderReleaseForm()

    expect(await screen.findByText('Unable to communicate with the file store')).toBeDefined()
  })

  it('does not offer file upload while the model files are still being fetched', async () => {
    mockFilesHook({ isFilesLoading: true })

    renderReleaseForm()

    await waitFor(() => {
      expect(screen.queryByText('Upload new files')).toBeNull()
    })
  })

  it('offers file upload once the model files have been fetched', async () => {
    renderReleaseForm()

    expect(await screen.findByText('Upload new files')).toBeDefined()
  })
})
