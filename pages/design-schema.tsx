import { useGetCurrentUser } from '@/data/user'
import ComponentPicker from '@/src/SchemaDesign/ComponentPicker'
import Wrapper from '@/src/Wrapper'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

export default function DesignSchema() {
  const { currentUser } = useGetCurrentUser()

  return (
    <Wrapper title='Design Schema' page='design'>
      <Box display='flex' height='calc(100vh - 196px)'>
        {currentUser && currentUser.roles.includes('admin') ? (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <ComponentPicker />
              </Grid>
              <Grid item xs={8}>
                schema
              </Grid>
            </Grid>
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
