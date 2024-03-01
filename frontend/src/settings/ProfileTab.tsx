import Container from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { User } from 'types/types'

type ProfileTabProps = {
  user: User
}

export default function ProfileTab({ user }: ProfileTabProps) {
  return (
    <Container maxWidth='md'>
      <Typography fontWeight='bold'>Name</Typography>
      <Typography>{user.dn}</Typography>
    </Container>
  )
}
