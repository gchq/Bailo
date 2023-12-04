import { Card, Grid, Typography } from '@mui/material'
import SchemaList from 'src/schemas/SchemaList'

export default function SchemaTab() {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item lg={6} md={12} width='100%'>
          <Card variant='outlined' sx={{ p: 2 }}>
            <Typography color='primary' fontWeight='bold'>
              Model Schemas
            </Typography>
            <SchemaList schemaKind='model' />
          </Card>
        </Grid>
        <Grid item lg={6} md={12} width='100%'>
          <Card variant='outlined' sx={{ p: 2 }}>
            <Typography color='primary' fontWeight='bold'>
              Access Request Schemas
            </Typography>
            <SchemaList schemaKind='accessRequest' />
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
