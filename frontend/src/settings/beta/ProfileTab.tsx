import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { User } from 'types/v2/types'

type ProfileTabProps = {
  user: User
}

export default function ProfileTab({ user }: ProfileTabProps) {
  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography fontWeight='bold'>Name</Typography>
      <Typography>{user.dn}</Typography>
    </Box>
  )
}
