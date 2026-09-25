import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { postFileForModelId } from 'actions/file'
import FileUploadDialog from 'src/entry/model/files/FileUploadDialog'
import { testV2Model } from 'utils/test/testModels'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('actions/file', () => ({
  postFileForModelId: vi.fn(),
}))

vi.mock('actions/entry', () => ({
  deleteEntryFile: vi.fn(),
}))

function selectFile(fileName: string) {
  const fileInput = screen.getByTestId('uploadFileButton')
  fireEvent.change(fileInput, {
    target: { files: [new File(['test contents'], fileName, { type: 'text/plain' })] },
  })
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

describe('FileUploadDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      expect(vi.mocked(postFileForModelId).mock.calls[0][4]).toBe(undefined)
    })
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
})
