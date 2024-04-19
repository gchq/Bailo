import { Button, Card, Divider, Link, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import UserDisplay from 'src/common/UserDisplay'
import { EntryInterface, InferenceInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type InferenceDisplayProps = {
  model: EntryInterface
  inference: InferenceInterface
}

export default function InferenceDisplay({ model, inference }: InferenceDisplayProps) {
  const router = useRouter()
  return (
    <Card sx={{ width: '100%' }}>
      <Stack spacing={1} padding={2}>
        <Stack direction='row' justifyContent={'space-between'}>
          <Stack
            direction='row'
            spacing={2}
            divider={<Divider orientation='vertical' flexItem variant='middle' />}
            alignItems='center'
          >
            <Link href={`/model/${model.id}/inference/${inference.image}/${inference.tag}`}>
              <Typography component='h2' variant='h6' color='primary'>
                {inference.image}:{inference.tag}
              </Typography>
            </Link>
            <Typography fontWeight='bold' color='primary'>
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
