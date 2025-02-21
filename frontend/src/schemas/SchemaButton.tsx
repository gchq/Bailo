import { LoadingButton } from '@mui/lab'
import { Card, CardActions, CardContent, Divider, Grid2, Stack, Typography } from '@mui/material'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import { SchemaInterface } from 'types/types'

interface SchemaButtonProps {
  schema: SchemaInterface
  onClick: () => void
  loading?: boolean
}

export default function SchemaButton({ schema, onClick, loading = false }: SchemaButtonProps) {
  return (
    <Grid2 size={{ md: 6, sm: 12 }}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant='button' fontWeight='bold' color='primary'>
              {schema.name}
            </Typography>
            <MarkdownDisplay>{schema.description}</MarkdownDisplay>
          </Stack>
        </CardContent>
        <CardActions sx={{ px: 2, pb: 2, textAlign: 'right' }}>
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Divider />
            <LoadingButton
              loading={loading}
              variant='contained'
              size='small'
              onClick={onClick}
              data-test={`selectSchemaButton-${schema.id}`}
            >
              Select schema
            </LoadingButton>
          </Stack>
        </CardActions>
      </Card>
    </Grid2>
  )
}
