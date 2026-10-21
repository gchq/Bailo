import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useGetFilesForModel } from 'actions/file'
import { useGetEntryCardRevisions } from 'actions/modelCard'
import { useGetReleasesForModelId } from 'actions/release'
import UiConfigContext from 'src/contexts/uiConfigContext'
import ReleaseForm, { ReleaseFormData } from 'src/entry/model/releases/ReleaseForm'
import { lightTheme } from 'src/theme'
import { FileInterface } from 'types/types'
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

const uploadedFile = { _id: 'new-file-id', name: 'weights/model.bin' } as FileInterface

// Stands in for a completed upload, so the test drives only what the form does with the result.
vi.mock('src/entry/model/files/FileUploadDialog.tsx', () => ({
  default: ({ onFilesUploaded }: { onFilesUploaded: (files: FileInterface[]) => void }) => (
    <button onClick={() => onFilesUploaded([uploadedFile])}>Complete upload</button>
  ),
}))

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

function renderReleaseForm(formData: ReleaseFormData = emptyFormData, onFilesChange = vi.fn()) {
  return render(
    <ThemeProvider theme={lightTheme}>
      <UiConfigContext.Provider value={testUiConfig}>
        <ReleaseForm
          editable
          isEdit
          model={testV2Model}
          formData={formData}
          onSemverChange={vi.fn()}
          onReleaseNotesChange={vi.fn()}
          onMinorReleaseChange={vi.fn()}
          onFilesChange={onFilesChange}
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

  it('replaces a file of the same name on the release with a newly uploaded file', async () => {
    const existingFile = { _id: 'existing-file-id', name: 'weights/model.bin' } as FileInterface
    const otherFile = { _id: 'other-file-id', name: 'config.json' } as FileInterface
    const onFilesChange = vi.fn()

    renderReleaseForm({ ...emptyFormData, files: [existingFile, otherFile] }, onFilesChange)
    fireEvent.click(await screen.findByText('Complete upload'))

    expect(onFilesChange).toHaveBeenCalledWith([otherFile, uploadedFile])
  })

  it('adds a newly uploaded file to the release when no file of that name is on it', async () => {
    const otherFile = { _id: 'other-file-id', name: 'config.json' } as FileInterface
    const onFilesChange = vi.fn()

    renderReleaseForm({ ...emptyFormData, files: [otherFile] }, onFilesChange)
    fireEvent.click(await screen.findByText('Complete upload'))

    expect(onFilesChange).toHaveBeenCalledWith([otherFile, uploadedFile])
  })
})
