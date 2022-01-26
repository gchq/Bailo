import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { useRouter } from 'next/router'

import FileInput from '../common/FileInput'
import { Schema } from '../../types/interfaces'

export default function UploadFile({ onSubmit, schema }: { onSubmit: Function; schema: Schema }) {
  const [code, setCode] = useState(undefined)
  const [binary, setBinary] = useState(undefined)
  const [metadata, setMetadata] = useState('')

  const router = useRouter()

  const handleCodeChange = (e: any) => {
    setCode(e.target.files[0])
  }

  const handleBinaryChange = (e: any) => {
    setBinary(e.target.files[0])
  }

  const handleMetadataChange = (e: any) => {
    setMetadata(e.target.value)
  }

  const handleUpload = () => {
    onSubmit(JSON.parse(metadata), schema, { code, binary })
  }

  return (
    <>
      <Stack direction='row' spacing={2} alignItems='center'>
        <FileInput
          disabled={router.query.mode === 'edit'}
          label={'Select Code'}
          file={code}
          onChange={handleCodeChange}
          accepts='.zip'
        />
        <FileInput
          disabled={router.query.mode === 'edit'}
          label={'Select Binary'}
          file={binary}
          onChange={handleBinaryChange}
          accepts='.zip'
        />
      </Stack>

      <Box sx={{ py: 2 }} />

      <TextField fullWidth multiline rows={4} label='Metadata' value={metadata} onChange={handleMetadataChange} />

      <Button variant='contained' onClick={handleUpload} sx={{ mt: 3 }} data-test='submitButton'>
        {router.query.mode === 'edit' ? 'Edit' : 'Upload'}
      </Button>
    </>
  )
}
