import { Box, Stack, Typography } from '@mui/material'
import MyAccessRequests from 'src/accessRequests/MyAccessRequests'
import Title from 'src/common/Title'

export default function Access() {
  return (
    <>
      <Title text='Your access' />
      <Stack spacing={1} sx={{ px: 2, pb: 1 }}>
        <Typography component='h1' color='primary' variant='h6'>
          Your access requests
        </Typography>
        <Box>Access requests you created, or that include you or one of your groups as an access entity.</Box>
      </Stack>
      <MyAccessRequests />
    </>
  )
}
