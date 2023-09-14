import { Button, Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'

import { SchemaInterface } from '../../../../types/types'

interface SchemaButtonProps {
  modelId: string
  schema: any
}

export default function SchemaButton({ modelId, schema }: SchemaButtonProps) {
  const router = useRouter()

  async function createAccessRequestUsingSchema(newSchema: SchemaInterface) {
    router.push(`/beta/model/${modelId}/access/new?schemaId=${newSchema.id}`)
  }

  return (
    <Grid item md={4} sm={12}>
      <Tooltip title={schema.description}>
        <Button
          sx={{ width: '200px', height: '60px' }}
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
        </Button>
      </Tooltip>
    </Grid>
  )
}
