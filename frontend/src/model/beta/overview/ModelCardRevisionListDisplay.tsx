import { ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { ModelCardRevisionInterface } from 'types/v2/types'

type revisionProp = {
  modelCard: ModelCardRevisionInterface
}
export default function ModelCardRevisionListDisplay({ modelCard }: revisionProp) {
  const router = useRouter()
  const { modelId }: { modelId: string } = router.query
  return (
    <ListItem sx={{ fontSize: '20px' }}>
      <ListItemButton onClick={() => router.push(`/beta/model/${modelId}/history`)}>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
          <Typography>{`#${modelCard.version}`}</Typography>
          <Typography>{modelCard.createdBy}</Typography>

          <Typography>{modelCard.createdAt.toString()}</Typography>
        </Stack>
      </ListItemButton>
    </ListItem>
  )
}
