import FolderOpen from '@mui/icons-material/FolderOpen'
import { Box, Stack } from '@mui/material'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import { ChangeEvent, useCallback, useMemo, useRef } from 'react'
import { FileInterface, FileWithMetadataAndTags } from 'types/types'
const Input = styled('input')({
  display: 'none',
})

type MultiFileInputProps = {
  label: string
  files: (File | FileInterface)[]
  filesMetadata: FileWithMetadataAndTags[]
  onFilesChange: (value: (File | FileInterface)[]) => void
  onFilesMetadataChange: (value: FileWithMetadataAndTags[]) => void
  accepts?: string
  disabled?: boolean
  fullWidth?: boolean
  readOnly?: boolean
}

export default function MultiFileInput({
  label,
  files,
  filesMetadata,
  onFilesChange,
  onFilesMetadataChange,
  accepts = '',
  disabled = false,
  fullWidth = false,
  readOnly = false,
}: MultiFileInputProps) {
  const htmlId = useMemo(() => `${label.replace(/ /g, '-').toLowerCase()}-file`, [label])
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleAddFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawFiles = event.target.files ? Array.from(event.target.files) : []
      // For folder uploads, use webkitRelativePath as the file name so paths are preserved
      const newFiles = rawFiles.map((file) => {
        if (file.webkitRelativePath) {
          Object.defineProperty(file, 'name', { value: file.webkitRelativePath, writable: false })
        }
        return file
      })
      if (newFiles.length) {
        if (files) {
          const updatedFiles = [
            ...files.filter((file) => !newFiles.some((newFile) => newFile.name === file.name)),
            ...newFiles,
          ]
          onFilesChange(updatedFiles)
        } else {
          onFilesChange(newFiles)
        }
        onFilesMetadataChange([
          ...filesMetadata.filter(
            (fileMetadata) => !newFiles.some((newFile) => newFile.name === fileMetadata.fileName),
          ),
          ...newFiles.map((newFile) => ({ fileName: newFile.name, metadata: { text: '', tags: [] } })),
        ])
      }
      event.target.value = ''
    },
    [files, filesMetadata, onFilesChange, onFilesMetadataChange],
  )

  return (
    <Box sx={{ ...(fullWidth && { width: '100%' }) }}>
      {!readOnly && (
        <>
          <Stack direction='row' spacing={1} sx={{ width: '100%' }}>
            <label htmlFor={htmlId} style={{ flex: 1 }}>
              <Button fullWidth component='span' variant='outlined' disabled={disabled}>
                {label}
              </Button>
            </label>
            <Button
              variant='outlined'
              disabled={disabled}
              endIcon={<FolderOpen />}
              onClick={() => folderInputRef.current?.click()}
            >
              Select new folder
            </Button>
          </Stack>
          <Input
            multiple
            id={htmlId}
            type='file'
            onChange={handleAddFile}
            accept={accepts}
            disabled={disabled}
            data-test='uploadFileButton'
          />
          <input
            ref={(el) => {
              folderInputRef.current = el
              if (el) {
                el.setAttribute('webkitdirectory', '')
              }
            }}
            type='file'
            style={{ display: 'none' }}
            onChange={handleAddFile}
            disabled={disabled}
            data-test='uploadFolderButton'
          />
        </>
      )}
    </Box>
  )
}
