import { LoadingButton } from '@mui/lab'
import { DialogActions, DialogContent, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function DockerToken() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setIsLoading(true)
    router.push('/settings?tab=authentication&category=docker')
  }
  return (
    <DialogContent>
      <Typography>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
        consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
        laborum.
      </Typography>
      <DialogActions>
        <LoadingButton variant='contained' loading={isLoading} onClick={handleClose}>
          Continue
        </LoadingButton>
      </DialogActions>
    </DialogContent>
  )
}
