import { useGetCurrentUser } from '@/data/user'
import ComponentPicker from '@/src/SchemaDesign/ComponentPicker'
import Wrapper from '@/src/Wrapper'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export default function DesignSchema() {
  const { currentUser } = useGetCurrentUser()

  return (
    <Wrapper title='Design Schema' page='design'>
      <Box display='flex' height='calc(100vh - 196px)'>
        {currentUser && currentUser.roles.includes('admin') ? (
          <Box>
            <Stack direction='row' spacing={2}>
              <Box>
                <ComponentPicker />
              </Box>
              <Box>schema</Box>
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
