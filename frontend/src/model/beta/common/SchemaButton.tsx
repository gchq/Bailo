import { LoadingButton } from '@mui/lab'
import { Card, CardActions, CardContent, Divider, Grid, Stack, Typography } from '@mui/material'
import { useCallback, useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Link from 'src/Link'

interface SchemaButtonProps {
  modelId: string
  schema: any
  onClickAction: () => void
}

export default function SchemaButton({ modelId, schema, onClickAction }: SchemaButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOnClick = useCallback(() => {
    setLoading(true)
    onClickAction()
  }, [onClickAction])

  return (
    <Grid item md={6} sm={12}>
      <Card
        variant='outlined'
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
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
            <Link href={`/beta/model/${modelId}/access-request/new?schemaId=${schema.id}`}>
              <LoadingButton loading={loading} variant='contained' size='small' onClick={handleOnClick}>
                Select schema
              </LoadingButton>
            </Link>
          </Stack>
        </CardActions>
      </Card>
    </Grid>
  )
}
