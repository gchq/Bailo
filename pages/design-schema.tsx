import { useGetCurrentUser } from '@/data/user'
import Wrapper from '@/src/Wrapper'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import SchemaDesigner from '@/src/SchemaDesign/SchemaDesigner'

export default function DesignSchema() {
  const { currentUser } = useGetCurrentUser()

  return (
    <Wrapper title='Design Schema' page='design'>
      <Box display='flex'>
        {currentUser && currentUser.roles.includes('admin') ? (
          <Box>
            <Stack direction='row' spacing={2}>
              <Box>
                <SchemaDesigner />
              </Box>
            </Stack>
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
