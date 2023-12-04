import { Card, Grid, Typography } from '@mui/material'
import SchemaList from 'src/schemas/SchemaList'

export default function SchemaTab() {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item lg={6} xs={12} width='100%'>
          <Card sx={{ p: 2 }}>
            <Typography color='primary' variant='h6' component='h2'>
              Model Schemas
            </Typography>
            <SchemaList schemaKind='model' />
          </Card>
        </Grid>
        <Grid item lg={6} xs={12} width='100%'>
          <Card sx={{ p: 2 }}>
            <Typography color='primary' variant='h6' component='h2'>
              Access Request Schemas
            </Typography>
            <SchemaList schemaKind='accessRequest' />
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
