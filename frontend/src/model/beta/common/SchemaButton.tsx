import { LoadingButton } from '@mui/lab'
import { Box, Divider, Grid, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback, useState } from 'react'
import Link from 'src/Link'

interface SchemaButtonProps {
  modelId: string
  schema: any
  onClickAction: () => void
}

export default function SchemaButton({ modelId, schema, onClickAction }: SchemaButtonProps) {
  const [loading, setLoading] = useState(false)
  const theme = useTheme()

  const handleOnClick = useCallback(() => {
    setLoading(true)
    onClickAction()
  }, [onClickAction])

  return (
    <Grid item md={6} sm={12}>
      <Box sx={{ border: 'solid', borderRadius: 2, borderWidth: 1, borderColor: theme.palette.primary.main, p: 2 }}>
        <Stack sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} spacing={2}>
          <Typography variant='button' fontWeight='bold' color='primary'>
            {schema.name}
          </Typography>
          <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} variant='caption'>
            {schema.description}
          </Typography>
          <Divider />
          <Link href={`/beta/model/${modelId}/access-request/new?schemaId=${schema.id}`}>
            <Box sx={{ textAlign: 'right' }}>
              <LoadingButton loading={loading} variant='outlined' size='small' onClick={handleOnClick}>
                Select schema
              </LoadingButton>
            </Box>
          </Link>
        </Stack>
      </Box>
    </Grid>
  )
}
