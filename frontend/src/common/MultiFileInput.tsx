import { Box, Chip } from '@mui/material'
import Button from '@mui/material/Button'
import { styled } from '@mui/system'
import { ChangeEvent, useMemo } from 'react'

const Input = styled('input')({
  display: 'none',
})

const displayFilename = (filename: string) => {
  const parts = filename.split('.')
  const ext = parts.pop()
  const base = parts.join('.')
  return base.length > 12 ? `${base}...${ext}` : filename
}

type MultiFileInputProps = {
  label: string
  files: File[]
  onChange: (value: File[]) => void
  accepts?: string
  disabled?: boolean
  fullWidth?: boolean
  readOnly?: boolean
}

export default function MultiFileInput({
  label,
  onChange,
  files,
  accepts = '',
  disabled = false,
  fullWidth = false,
  readOnly = false,
}: MultiFileInputProps) {
  const htmlId = useMemo(() => `${label.replace(/ /g, '-').toLowerCase()}-file`, [label])

  function handleDelete(fileToDelete: File) {
    if (files) {
      const updatedFileList = files.filter((file) => file.name !== fileToDelete.name)
      onChange(updatedFileList)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const newFiles = event.target.files ? Array.from(event.target.files) : []
    if (newFiles) {
      if (files) {
        const updatedFiles = newFiles.concat(
          files.filter((file) => !newFiles.some((newFile) => newFile.name === file.name)),
        )
        onChange(updatedFiles)
      } else {
        onChange(newFiles)
      }
    }
  }

  return (
    <Box sx={{ ...(fullWidth && { width: '100%' }) }}>
      {!readOnly && (
        <Box mb={2}>
          <label htmlFor={htmlId}>
            <Button fullWidth component='span' variant='outlined' disabled={disabled}>
              {label}
            </Button>
          </label>
          <Input multiple id={htmlId} type='file' onInput={handleFileChange} accept={accepts} disabled={disabled} />
        </Box>
      )}
      {files.map((file) => (
        <Chip
          sx={{ mr: 1, mb: 1 }}
          color='primary'
          label={displayFilename(file.name)}
          onDelete={() => handleDelete(file)}
          key={file.name}
        />
      ))}
    </Box>
  )
}
