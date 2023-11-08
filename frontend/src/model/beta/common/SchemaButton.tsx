import { LoadingButton } from '@mui/lab'
import { Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import Link from 'src/Link'

interface SchemaButtonProps {
  modelId: string
  schema: any
}

export default function SchemaButton({ modelId, schema }: SchemaButtonProps) {
  const [loading, setLoading] = useState(false)

  return (
    <Grid item md={4} sm={12}>
      <Tooltip title={schema.description}>
        <Link href={`/beta/model/${modelId}/access-request/new?schemaId=${schema.id}`}>
          <LoadingButton
            sx={{ width: '200px', height: '60px' }}
            loading={loading}
            variant='outlined'
            size='large'
            onClick={() => setLoading(true)}
          >
            <Stack sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Typography variant='button'>{schema.name}</Typography>
              <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} variant='caption'>
                {schema.description}
              </Typography>
            </Stack>
          </LoadingButton>
        </Link>
      </Tooltip>
    </Grid>
  )
}
