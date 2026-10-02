import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { deleteEntryFile } from 'actions/entry'
import { postFileForModelId } from 'actions/file'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import FileUploadDialog from 'src/entry/model/files/FileUploadDialog'
import { defaultUserPermissions } from 'src/hooks/UserPermissionsHook'
import { lightTheme } from 'src/theme'
import { FileInterface } from 'types/types'
import { testUiConfig, testV2Model } from 'utils/test/testModels'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('actions/file', () => ({
  postFileForModelId: vi.fn(),
}))

vi.mock('actions/entry', () => ({
  deleteEntryFile: vi.fn(),
}))

// The tag editor renders AdditionalInformation, which fetches the UI config.
vi.mock('actions/uiConfig', () => ({
  useGetUiConfig: vi.fn(() => ({
    uiConfig: testUiConfig,
    isUiConfigLoading: false,
    isUiConfigError: undefined,
  })),
}))

function selectFile(fileName: string) {
  const fileInput = screen.getByTestId('uploadFileButton')
  fireEvent.change(fileInput, {
    target: { files: [new File(['test contents'], fileName, { type: 'text/plain' })] },
  })
}

// Mirrors what the browser does for a folder upload: each File carries its path relative to the
// selected folder in webkitRelativePath, which is read-only and so has to be defined explicitly.
function selectFolder(relativePaths: string[]) {
  const files = relativePaths.map((relativePath) => {
    const file = new File(['test contents'], relativePath.split('/').pop() as string, { type: 'text/plain' })
    Object.defineProperty(file, 'webkitRelativePath', { value: relativePath })
    return file
  })
  fireEvent.change(screen.getByTestId('uploadFolderButton'), { target: { files } })
}

function renderDialog(initialUploadPath: string) {
  return render(
    <FileUploadDialog
      model={testV2Model}
      open
      onDialogClose={vi.fn()}
      mutateModelFiles={vi.fn()}
      initialUploadPath={initialUploadPath}
    />,
  )
}

// The file tag editor sits behind a Restricted check, so it only renders with editEntry granted.
function renderDialogAsEditor() {
  return render(
    // TagSelector reads custom palette entries, so it needs the application theme.
    <ThemeProvider theme={lightTheme}>
      <UserPermissionsContext.Provider
        value={{
          userPermissions: { ...defaultUserPermissions, editEntry: { hasPermission: true } },
        }}
      >
        <FileUploadDialog
          model={testV2Model}
          open
          onDialogClose={vi.fn()}
          mutateModelFiles={vi.fn()}
          initialUploadPath=''
        />
      </UserPermissionsContext.Provider>
    </ThemeProvider>,
  )
}

function uploadedMetadataFor(uploadPath: string) {
  const call = vi.mocked(postFileForModelId).mock.calls.find((c) => c[4] === uploadPath)
  return call?.[3]
}

describe('FileUploadDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('files sharing a base name in different folders', () => {
    const siblings = ['weights/b/config.json', 'weights/c/config.json']

    it('removes only the file whose row was deleted', async () => {
      renderDialog('')

      selectFolder(siblings)
      await screen.findByText(siblings[0])

      // Each row renders its path as a deletable Chip.
      const rowToDelete = screen.getByText(siblings[0]).closest('.MuiChip-root') as HTMLElement
      fireEvent.click(rowToDelete.querySelector('.MuiChip-deleteIcon') as HTMLElement)

      await waitFor(() => {
        expect(screen.queryByText(siblings[0])).toBeNull()
      })
      expect(screen.queryByText(siblings[1])).not.toBeNull()
    })

    it('applies a tag only to the file it was entered against', async () => {
      vi.mocked(postFileForModelId).mockResolvedValue({ data: { file: { _id: 'abc' } } } as never)
      renderDialogAsEditor()

      selectFolder(siblings)
      await screen.findByText(siblings[0])

      // Open the tag editor belonging to the first file's row.
      const firstRow = screen.getByText(siblings[0]).closest('.MuiGrid-container') as HTMLElement
      fireEvent.click(within(firstRow).getByText(/Edit file tags/))

      const addTagButton = await screen.findByText('Add tag')
      const tagEditor = addTagButton.closest('.MuiPaper-root') as HTMLElement
      fireEvent.change(within(tagEditor).getByRole('textbox'), { target: { value: 'alpha' } })
      fireEvent.click(addTagButton)

      fireEvent.click(await screen.findByText('Upload files'))

      await waitFor(() => {
        expect(vi.mocked(postFileForModelId)).toHaveBeenCalledTimes(2)
      })
      expect(uploadedMetadataFor(siblings[0])?.tags).toEqual(['alpha'])
      expect(uploadedMetadataFor(siblings[1])?.tags ?? []).toEqual([])
    })
  })

  it('defaults the destination to the path the user has navigated to in the file browser', async () => {
    renderDialog('models/v1/weights')

    const destinationInput = await screen.findByTestId('destinationPathInput')
    await waitFor(() => {
      expect(destinationInput.querySelector('input')?.value).toBe('models/v1/weights')
    })
  })

  it('uploads to the browsed path when the destination is left untouched', async () => {
    vi.mocked(postFileForModelId).mockResolvedValue({ data: { file: { _id: 'abc' } } } as never)
    renderDialog('models/v1/weights')

    selectFile('example.txt')
    fireEvent.click(await screen.findByText('Upload files'))

    await waitFor(() => {
      expect(vi.mocked(postFileForModelId).mock.calls[0][4]).toBe('models/v1/weights/example.txt')
    })
  })

  it('applies a destination changed after the files were selected', async () => {
    vi.mocked(postFileForModelId).mockResolvedValue({ data: { file: { _id: 'abc' } } } as never)
    renderDialog('models/v1/weights')

    selectFile('example.txt')
    const destinationInput = screen.getByTestId('destinationPathInput').querySelector('input') as HTMLInputElement
    fireEvent.change(destinationInput, { target: { value: 'models/v2/weights' } })
    fireEvent.click(await screen.findByText('Upload files'))

    await waitFor(() => {
      expect(vi.mocked(postFileForModelId).mock.calls[0][4]).toBe('models/v2/weights/example.txt')
    })
  })

  it('uploads to the root when the destination is cleared', async () => {
    vi.mocked(postFileForModelId).mockResolvedValue({ data: { file: { _id: 'abc' } } } as never)
    renderDialog('models/v1/weights')

    selectFile('example.txt')
    const destinationInput = screen.getByTestId('destinationPathInput').querySelector('input') as HTMLInputElement
    fireEvent.change(destinationInput, { target: { value: '' } })
    fireEvent.click(await screen.findByText('Upload files'))

    await waitFor(() => {
      // Uploaded at the root, under its own name and with no destination prefixed.
      expect(vi.mocked(postFileForModelId).mock.calls[0][4]).toBe('example.txt')
    })
  })

  it('keeps the folder structure when a folder is uploaded to the root', async () => {
    vi.mocked(postFileForModelId).mockResolvedValue({ data: { file: { _id: 'abc' } } } as never)
    renderDialog('')

    selectFolder(['weights/b/model.bin', 'weights/c/config.json'])
    fireEvent.click(await screen.findByText('Upload files'))

    await waitFor(() => {
      expect(vi.mocked(postFileForModelId)).toHaveBeenCalledTimes(2)
    })
    const uploadedNames = vi.mocked(postFileForModelId).mock.calls.map((call) => call[4])
    expect(uploadedNames).toContain('weights/b/model.bin')
    expect(uploadedNames).toContain('weights/c/config.json')
  })

  it('blocks uploading while the destination path is invalid', async () => {
    renderDialog('')

    selectFile('example.txt')
    const destinationInput = screen.getByTestId('destinationPathInput').querySelector('input') as HTMLInputElement
    fireEvent.change(destinationInput, { target: { value: '/models' } })

    const uploadButton = (await screen.findByText('Upload files')).closest('button')
    await waitFor(() => {
      expect(screen.getByText('Path should not start or end with a slash')).toBeTruthy()
      expect(uploadButton?.disabled).toBe(true)
    })
  })

  it('prevents further file selection while an upload is in progress', async () => {
    let resolveUpload: (value: unknown) => void = () => undefined
    vi.mocked(postFileForModelId).mockImplementation(() => new Promise((resolve) => (resolveUpload = resolve)) as never)
    renderDialog('')

    selectFile('example.txt')
    fireEvent.click(await screen.findByText('Upload files'))

    await waitFor(() => {
      expect((screen.getByTestId('uploadFileButton') as HTMLInputElement).disabled).toBe(true)
      expect((screen.getByTestId('uploadFolderButton') as HTMLInputElement).disabled).toBe(true)
      expect(screen.getByText('Select folder').closest('button')?.disabled).toBe(true)
    })

    resolveUpload({ data: { file: { _id: 'abc' } } })
  })

  describe('overwriting an existing file', () => {
    const existingFile = {
      _id: 'existing-file-id',
      name: 'example.txt',
      size: 1234,
      createdAt: new Date('2026-01-01'),
    } as unknown as FileInterface

    async function overwriteExistingFile() {
      render(
        <FileUploadDialog
          model={testV2Model}
          open
          onDialogClose={vi.fn()}
          mutateModelFiles={vi.fn()}
          initialUploadPath=''
          existingFiles={[existingFile]}
        />,
      )

      selectFile('example.txt')
      fireEvent.click(await screen.findByText('Upload files'))
      fireEvent.click(await screen.findByText('Overwrite'))
      fireEvent.click(await screen.findByText('Continue Upload'))
    }

    it('keeps the existing file when the replacement upload fails', async () => {
      vi.mocked(deleteEntryFile).mockResolvedValue({ ok: true } as Response)
      vi.mocked(postFileForModelId).mockRejectedValue(new Error('network died mid-transfer'))

      await overwriteExistingFile()

      await waitFor(() => {
        expect(vi.mocked(postFileForModelId)).toHaveBeenCalled()
      })
      expect(vi.mocked(deleteEntryFile)).not.toHaveBeenCalled()
    })

    it('deletes the existing file only after the replacement has uploaded', async () => {
      vi.mocked(deleteEntryFile).mockResolvedValue({ ok: true } as Response)
      vi.mocked(postFileForModelId).mockResolvedValue({ data: { file: { _id: 'new-file-id' } } } as never)

      await overwriteExistingFile()

      await waitFor(() => {
        expect(vi.mocked(deleteEntryFile)).toHaveBeenCalledWith(testV2Model.id, 'existing-file-id')
      })
      expect(vi.mocked(postFileForModelId).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(deleteEntryFile).mock.invocationCallOrder[0],
      )
    })
  })
})
