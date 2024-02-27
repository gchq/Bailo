import { LoadingButton } from '@mui/lab'
import { DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'
import CopyInputTextField from 'src/settings/authentication/CopyInputTextField'

export default function DockerLogin() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setIsLoading(true)
    router.push('/settings?tab=authentication&category=docker')
  }
  return (
    <DialogContent
      sx={{
        width: '600px',
        height: '400px',
        overflow: 'auto',
      }}
    >
      <Stack spacing={2}>
        <Typography fontWeight='bold'>1. Run Docker login:</Typography>
        <Typography>Enter the following command on the command line: </Typography>
        <CopyInputTextField text={`docker login -u="<access-key>" -p="<secret-key>" <registry-url>`} />
      </Stack>
      <DialogActions>
        <LoadingButton variant='contained' loading={isLoading} onClick={handleClose}>
          Continue
        </LoadingButton>
      </DialogActions>
    </DialogContent>
  )
}
