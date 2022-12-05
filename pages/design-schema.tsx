import { useGetCurrentUser } from '@/data/user'
import Wrapper from '@/src/Wrapper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import SchemaDesigner from '@/src/SchemaDesign/SchemaDesigner'

export default function DesignSchema() {
  const { currentUser } = useGetCurrentUser()

  return (
    <Wrapper title='Design Schema' page='design'>
      <Box display='flex'>
        {currentUser && currentUser.roles.includes('admin') ? (
          <Box>
            <SchemaDesigner />
          </Box>
        ) : (
          <Typography variant='h5' component='p'>
            Error: You are not authorised to view this page.
          </Typography>
        )}
      </Box>
    </Wrapper>
  )
}
