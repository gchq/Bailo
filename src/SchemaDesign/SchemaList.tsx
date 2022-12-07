import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import DeleteIcon from '@mui/icons-material/Delete'
import Tooltip from '@mui/material/Tooltip'

export default function SchemaList() {
  const schemas = [
    {
      name: 'Schema One',
      reference: 'schema/one',
      use: 'UPLOAD',
    },
    {
      name: 'Schema Two',
      reference: 'schema/two',
      use: 'UPLOAD',
    },
    {
      name: 'Schema Three',
      reference: 'schema/three',
      use: 'DEPLOYMENT',
    },
  ]
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item sm={12} md={6} sx={{ width: '100%' }}>
          <Paper sx={{ mt: 2, mb: 2, p: 2 }}>
            <Typography variant='h4'>Schema List</Typography>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant='h6'>Upload Schemas</Typography>
              {schemas &&
                schemas
                  .filter((schema) => schema.use === 'UPLOAD')
                  .map((schema) => (
                    <Box key={schema.reference}>
                      <Stack direction='row' alignItems='center' spacing={2}>
                        <Tooltip title='Delete schema' arrow placement='left'>
                          <IconButton aria-label='delete'>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        <Typography>{schema.name}</Typography>
                      </Stack>
                    </Box>
                  ))}
            </Box>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant='h6'>Deployment Schemas</Typography>
              {schemas &&
                schemas
                  .filter((schema) => schema.use === 'DEPLOYMENT')
                  .map((schema) => (
                    <Box key={schema.reference}>
                      <Stack direction='row' alignItems='center' spacing={2}>
                        <Tooltip title='Delete schema' arrow placement='left'>
                          <IconButton aria-label='delete'>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        <Typography>{schema.name}</Typography>
                      </Stack>
                    </Box>
                  ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item sm={12} md={6} sx={{ width: '100%' }}>
          <Paper sx={{ mt: 2, mb: 2, p: 2 }}>
            <Stack spacing={2} alignItems='center'>
              <Typography variant='caption'>Have an existing schema? Upload it directly below!</Typography>
              <Button sx={{ maxWidth: '250px' }} variant='contained'>
                Upload Schema
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
