import { LoadingButton } from '@mui/lab'
import { Box, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function PersonalAuthentication() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToken = () => {
    setIsLoading(true)
    router.push('/beta/settings/personal-access-tokens/new')
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent={{ xs: 'center', sm: 'space-between' }}
        alignItems='center'
        sx={{ pb: 2 }}
      >
        <Typography fontWeight='bold' mb={1}>
          Personal Access Tokens
        </Typography>
        <LoadingButton variant='outlined' loading={isLoading} onClick={handleAddToken}>
          Add token
        </LoadingButton>
      </Stack>
    </Box>
  )
}
