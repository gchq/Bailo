import { Grid, Typography } from '@mui/material'
import SchemaList from 'src/schemas/SchemaList'

export default function SchemaTab() {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item lg={6} md={12} sx={{ width: '100%' }}>
          <Typography color='primary' fontWeight='bold'>
            Model Schemas
          </Typography>
          <SchemaList schemaKind='model' />
        </Grid>
        <Grid item lg={6} md={12} sx={{ width: '100%' }}>
          <Typography color='primary' fontWeight='bold'>
            Access Request Schemas
          </Typography>
          <SchemaList schemaKind='accessRequest' />
        </Grid>
      </Grid>
    </>
  )
}
