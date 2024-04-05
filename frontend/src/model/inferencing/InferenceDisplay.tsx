import { Button, Card, Divider, Link, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import UserDisplay from 'src/common/UserDisplay'
import { formatDateString } from 'utils/dateUtils'

import { InferenceInterface, ModelInterface } from '../../../types/types'

type InferenceDisplayProps = {
  model: ModelInterface
  inference: InferenceInterface
}

export default function InferenceDisplay({ model, inference }: InferenceDisplayProps) {
  const router = useRouter()
  return (
    <Card sx={{ width: '100%' }}>
      <Stack spacing={1} padding={2}>
        <Stack direction='row' justifyContent={'space-between'}>
          <Stack direction='row' spacing={2}>
            <Link
              href={`/model/${model.id}/inference/${inference.image}/${inference.tag}`}
              sx={{ alignSelf: 'center' }}
            >
              <Typography component='h2' variant='h6' color='primary'>
                {inference.image}:{inference.tag}
              </Typography>
            </Link>
            <Divider orientation='vertical' flexItem variant='middle' />
            <Typography fontWeight='bold' color='primary' sx={{ alignSelf: 'center' }}>
              {inference.settings.processorType}
            </Typography>
          </Stack>
          <Button
            onClick={() => router.push(`/model/${model.id}/inference/${inference.image}/${inference.tag}/settings`)}
          >
            View Settings
          </Button>
        </Stack>
        <Typography variant='caption' sx={{ mb: 2 }}>
          Created by {<UserDisplay dn={inference.createdBy} />} on
          <Typography variant='caption' fontWeight='bold'>
            {` ${formatDateString(inference.createdAt)}`}
          </Typography>
        </Typography>
        <Typography>{inference.description}</Typography>
      </Stack>
    </Card>
  )
}
