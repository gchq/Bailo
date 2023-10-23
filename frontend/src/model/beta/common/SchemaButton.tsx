import { LoadingButton } from '@mui/lab'
import { Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { SchemaInterface } from '../../../../types/types'

interface SchemaButtonProps {
  modelId: string
  schema: any
}

export default function SchemaButton({ modelId, schema }: SchemaButtonProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)

  async function createAccessRequestUsingSchema(newSchema: SchemaInterface) {
    setLoading(true)
    router.push(`/beta/model/${modelId}/access/new?schemaId=${newSchema.id}`)
  }

  return (
    <Grid item md={4} sm={12}>
      <Tooltip title={schema.description}>
        <LoadingButton
          sx={{ width: '200px', height: '60px' }}
          loading={loading}
          variant='outlined'
          size='large'
          onClick={() => createAccessRequestUsingSchema(schema)}
        >
          <Stack sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Typography variant='button'>{schema.name}</Typography>
            <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} variant='caption'>
              {schema.description}
            </Typography>
          </Stack>
        </LoadingButton>
      </Tooltip>
    </Grid>
  )
}
