import { Divider, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { ThemeProvider, useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'

import { ModelCardRevisionInterface } from '../../../../types/v2/types'
import { formatDateString } from '../../../../utils/dateUtils'

type revisionProp = {
  modelCard: ModelCardRevisionInterface
}
export default function ModelCardRevisionListDisplay({ modelCard }: revisionProp) {
  const router = useRouter()
  const { modelId, modelCardVersion }: { modelId?: string; modelCardVersion?: number } = router.query
  const theme = useTheme()

  return (
    <ThemeProvider theme={theme}>
      <Stack direction='column' justifyContent='space-evenly' alignItems='center' spacing={0.5}>
        <ListItem sx={{ fontSize: '20px' }}>
          <ListItemButton
            // sx={{ border: '0.5px solid grey' }}
            onClick={() => router.push(`/beta/model/${modelId}/history/${modelCardVersion}`)}
          >
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
              <Typography color='secondary'>{modelCard.version}</Typography>
              <Divider orientation='vertical' flexItem />
              <Typography color='primary'>{modelCard.createdBy}</Typography>

              <Typography color='primary'>{formatDateString(modelCard.createdAt)}</Typography>
            </Stack>
          </ListItemButton>
        </ListItem>
      </Stack>
    </ThemeProvider>
  )
}
