import { Box, Container, Typography } from '@mui/material'
import { User } from 'types/types'

type ProfileTabProps = {
  user: User
}

export default function ProfileTab({ user }: ProfileTabProps) {
  return (
    <Container maxWidth='md'>
      <Box>
        <Typography fontWeight='bold'>Name</Typography>
        <Typography>{user.dn}</Typography>
      </Box>
    </Container>
  )
}
