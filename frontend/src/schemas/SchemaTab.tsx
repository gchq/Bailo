import { Card, Grid, Typography } from '@mui/material'
import SchemaList from 'src/schemas/SchemaList'
import { SchemaKind } from 'types/types'

export default function SchemaTab() {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item lg={6} xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography color='primary' variant='h6' component='h2'>
              Model Schemas
            </Typography>
            <SchemaList schemaKind={SchemaKind.MODEL} />
          </Card>
        </Grid>
        <Grid item lg={6} xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography color='primary' variant='h6' component='h2'>
              Access Request Schemas
            </Typography>
            <SchemaList schemaKind={SchemaKind.ACCESS_REQUEST} />
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
