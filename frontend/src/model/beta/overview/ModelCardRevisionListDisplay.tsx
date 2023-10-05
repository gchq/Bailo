import { ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { ThemeProvider, useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { ModelCardRevisionInterface } from 'types/v2/types'

type revisionProp = {
  modelCard: ModelCardRevisionInterface
}
export default function ModelCardRevisionListDisplay({ modelCard }: revisionProp) {
  const router = useRouter()
  const { modelId, modelCardVersion }: { modelId: string; modelCardVersion: number } = router.query
  const theme = useTheme()

  function formatDate(timestamp: string) {
    const date = new Date(timestamp)
    const year = date.getFullYear().toString()
    const formattedYear = `'${year.substring(date.getFullYear().toString().length - 2)}`
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${formattedYear}`
  }
  return (
    <ThemeProvider theme={theme}>
      <Stack direction='column' justifyContent='space-evenly' alignItems='center' spacing={0.5}>
        <ListItem sx={{ fontSize: '20px', borderColor: theme.palette.primary.main }}>
          <ListItemButton onClick={() => router.push(`/beta/model/${modelId}/history/${modelCardVersion}`)}>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
              <Typography>{`#${modelCard.version}`}</Typography>
              <Typography>{modelCard.createdBy}</Typography>

              <Typography>{formatDate(modelCard.createdAt.toString())}</Typography>
            </Stack>
          </ListItemButton>
        </ListItem>
      </Stack>
    </ThemeProvider>
  )
}

{
  /* <Typography>Date:</Typography>
          <Typography>{modelCard.createdAt.toString().split(`T`).join(' ')}</Typography> */
}
