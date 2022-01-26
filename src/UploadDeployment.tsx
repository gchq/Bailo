import { useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

export default function UploadDeployment({ onSubmit, schema }: { onSubmit: any; schema: any }) {
  const [deploymentMetadata, setDeploymentMetadata] = useState('')

  const handleDeploymentMetadataChange = (e: any) => {
    setDeploymentMetadata(e.target.value)
  }

  const handleUpload = () => {
    onSubmit(JSON.parse(deploymentMetadata), schema)
  }

  return (
    <>
      <TextField
        fullWidth
        multiline
        rows={4}
        label='Deployment Metadata'
        value={deploymentMetadata}
        onChange={handleDeploymentMetadataChange}
      />

      <Button variant='contained' onClick={handleUpload} sx={{ mt: 3 }} data-test='submitButton'>
        {'Upload'}
      </Button>
    </>
  )
}
