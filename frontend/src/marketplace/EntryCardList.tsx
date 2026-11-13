import CorporateFare from '@mui/icons-material/CorporateFare'
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { type EntrySearchResult } from 'actions/entry'
import ChipSelector from 'src/common/ChipSelector'
import EmptyBlob from 'src/common/EmptyBlob'
import MessageAlert from 'src/MessageAlert'
import { EntryKind, type PeerConfigStatus } from 'types/types'
import { getEntryUrl } from 'utils/peerUtils'
import { entryKindForRedirect } from 'utils/routerUtils'

interface EntryCardListProps {
  entries: EntrySearchResult[]
  selectedChips: string[]
  onSelectedChipsChange: (chips: string[]) => void
  selectedOrganisations: string[]
  onSelectedOrganisationsChange: (chips: string[]) => void
  selectedStates: string[]
  onSelectedStatesChange: (chips: string[]) => void
  selectedPeers: string[]
  onSelectedPeersChange: (chips: string[]) => void
  entriesErrorMessage?: string
  displayOrganisation?: boolean
  displayState?: boolean
  displayPeers?: boolean
  peers?: Map<string, PeerConfigStatus>
}

export default function EntryCardList({
  entries,
  entriesErrorMessage,
  displayOrganisation = true,
  displayState = true,
  peers,
  selectedChips,
  onSelectedChipsChange,
}: EntryCardListProps) {
  const theme = useTheme()

  if (entriesErrorMessage) {
    return <MessageAlert message={entriesErrorMessage} severity='error' />
  }

  if (entries.length === 0) {
    return <EmptyBlob text='No items found' />
  }

  return (
    <Box
      data-test='entryCardList'
      sx={{
        display: 'grid',
        gridAutoRows: '1fr',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}
    >
      {entries.map((entry) => {
        const isExternal = entry.peerId !== undefined
        const peer = entry.peerId ? peers?.get(entry.peerId) : undefined
        const href = peer ? getEntryUrl(peer.config, entry) : `/${entryKindForRedirect(entry.kind)}/${entry.id}`

        return (
          <Card key={entry.id} sx={{ minWidth: 0, height: '100%' }}>
            <Box sx={{ backgroundColor: theme.palette.secondary.main, p: 1, height: '40px' }}>
              <Stack direction='row' spacing={1} sx={{ overflow: 'hidden' }}>
                {displayOrganisation && entry.organisation && (
                  <Chip
                    icon={<CorporateFare />}
                    size='small'
                    label={entry.organisation}
                    sx={{
                      color: 'white',
                      p: 0.5,
                      maxWidth: '100%',
                      '& .MuiChip-icon': { color: 'white' },
                      '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                    }}
                  />
                )}
                {displayState && entry.state && (
                  <Chip
                    label={entry.state}
                    size='small'
                    sx={{
                      color: 'white',
                    }}
                  />
                )}
              </Stack>
            </Box>
            <CardContent sx={{ flex: 1, overflow: 'hidden' }}>
              <CardActionArea
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noreferrer' : undefined}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                <Stack>
                  <Typography
                    component='h2'
                    color='primary'
                    sx={{
                      overflow: 'hidden',
                      fontWeight: 'bold',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {entry.name}
                  </Typography>
                  {entry.kind === EntryKind.MIRRORED_MODEL && (
                    <Typography variant='caption' color='secondary'>
                      (Mirrored)
                    </Typography>
                  )}
                  {entry.kind === EntryKind.UNTRUSTED_MODEL && (
                    <Typography variant='caption' color='warning'>
                      (Untrusted)
                    </Typography>
                  )}
                </Stack>
              </CardActionArea>
              <Typography
                color='text.secondary'
                sx={{
                  mt: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflowWrap: 'anywhere',
                }}
              >
                {entry.description}
              </Typography>
            </CardContent>
            <Box sx={{ px: 1, mb: 1 }}>
              {entry.tags.length > 0 && (
                <ChipSelector
                  chipTooltipTitle={'Filter by tag'}
                  options={entry.tags.slice(0, 10)}
                  expandThreshold={10}
                  multiple
                  selectedChips={selectedChips}
                  onChange={onSelectedChipsChange}
                  size='small'
                  ariaLabel='add tag to search filter'
                  style={{ maxWidth: '400px' }}
                />
              )}
            </Box>
          </Card>
        )
      })}
    </Box>
  )
}
