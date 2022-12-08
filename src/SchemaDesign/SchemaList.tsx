import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import { useGetSchemas } from '../../data/schema'

export default function SchemaList() {
  const { schemas: uploadSchemas, isSchemasLoading: isUploadSchemasLoading } = useGetSchemas('UPLOAD')
  const { schemas: deploymentSchemas, isSchemasLoading: isDeploymentSchemasLoading } = useGetSchemas('DEPLOYMENT')

  return (
    <Box>
      {!isUploadSchemasLoading && !isDeploymentSchemasLoading && (
        <Grid container spacing={2}>
          <Grid item sm={12} md={6} sx={{ width: '100%' }}>
            <Paper sx={{ mt: 2, mb: 2, p: 2 }}>
              <Typography variant='h4'>Schema List</Typography>
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant='h6'>Upload Schemas</Typography>
                {uploadSchemas &&
                  uploadSchemas.map((schema) => (
                    <Box key={schema.reference}>
                      <Typography>{schema.name}</Typography>
                    </Box>
                  ))}
              </Box>
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant='h6'>Deployment Schemas</Typography>
                {deploymentSchemas &&
                  deploymentSchemas.map((schema) => (
                    <Box key={schema.reference}>
                      <Typography>{schema.name}</Typography>
                    </Box>
                  ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item sm={12} md={6} sx={{ width: '100%' }}>
            <Paper sx={{ mt: 2, mb: 2, p: 2 }}>
              <Stack spacing={2} alignItems='center' sx={{ textAlign: 'center' }}>
                <Typography>Have an existing schema? Upload it directly below! </Typography>
                <Typography variant='caption'>
                  For more information on creating a schema yourself, please see{' '}
                  <Link target='_blank' href='/docs/administration/getting-started/configuration/making-a-schema'>
                    the documentation
                  </Link>
                  .
                </Typography>
                <Button sx={{ maxWidth: '250px' }} variant='contained'>
                  Upload Schema
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
