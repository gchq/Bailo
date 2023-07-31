import { Box, Chip } from '@mui/material'
import Button from '@mui/material/Button'
import { styled } from '@mui/system'
import { ChangeEvent, Dispatch, SetStateAction } from 'react'

const Input = styled('input')({
  display: 'none',
})

const displayFilename = (filename: string) => {
  const parts = filename.split('.')
  const ext = parts.pop()
  const base = parts.join('.')
  return base.length > 12 ? `${base}...${ext}` : filename
}

export default function MultiFileInput({
  label,
  setFiles,
  files,
  accepts,
  disabled,
  fullWidth = false,
}: {
  label: string
  setFiles: Dispatch<SetStateAction<File[] | undefined>>
  files?: File[]
  accepts?: string
  disabled?: boolean
  fullWidth?: boolean
}) {
  const id = `${label.replace(/ /g, '-').toLowerCase()}-file`

  function handleDelete(fileToDelete: File) {
    if (files) {
      const updatedFileList = files.filter((file) => file.name !== fileToDelete.name)
      setFiles(updatedFileList)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const newFiles = event.target.files ? Array.from(event.target.files) : []
    if (newFiles) {
      if (files) {
        const updatedFiles = newFiles.concat(
          files.filter((file) => newFiles.every((newFile) => newFile.name != file.name))
        )
        setFiles(updatedFiles)
      } else {
        setFiles(newFiles)
      }
    }
  }

  return (
    <div style={{ width: fullWidth ? '100%' : 'unset' }}>
      <label htmlFor={id}>
        <Input
          style={{ margin: '10px' }}
          id={id}
          type='file'
          onInput={handleFileChange}
          multiple
          accept={accepts}
          disabled={disabled}
        />
        <Button sx={{ width: fullWidth ? '100%' : 'unset' }} variant='outlined' component='span' disabled={disabled}>
          {label}
        </Button>
      </label>
      <Box sx={{ mt: 2 }}>
        <Box>
          {files &&
            files.length > 0 &&
            Array.from(files).map((file) => (
              <span key={file.name}>
                <Chip
                  sx={{ mr: 1, mb: 1 }}
                  color='primary'
                  label={displayFilename(file.name)}
                  onDelete={() => handleDelete(file)}
                />
              </span>
            ))}
        </Box>
      </Box>
    </div>
  )
}
