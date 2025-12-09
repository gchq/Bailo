import { CloudQueue, CorporateFare, LaunchOutlined } from '@mui/icons-material'
import { Box, Chip, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult } from 'actions/model'
import { CSSProperties, useMemo } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import Link from 'src/Link'
import { EntryKind, PeerConfigStatus } from 'types/types'
import { getEntryUrl } from 'utils/peerUtils'

interface EntryListRowProps {
  selectedChips: string[]
  onSelectedChipsChange: (chips: string[]) => void
  selectedOrganisations: string[]
  onSelectedOrganisationsChange: (organisations: string[]) => void
  selectedStates: string[]
  onSelectedStatesChange: (states: string[]) => void
  selectedPeers: string[]
  onSelectedPeersChange: (peers: string[]) => void
  entry: EntrySearchResult
  style: CSSProperties
  displayOrganisation?: boolean
  displayState?: boolean
  displayPeers?: boolean
  peers?: Map<string, PeerConfigStatus>
}

export default function EntryListRow({
  selectedChips,
  onSelectedChipsChange,
  selectedOrganisations,
  onSelectedOrganisationsChange,
  selectedStates,
  onSelectedStatesChange,
  selectedPeers,
  onSelectedPeersChange,
  entry,
  style,
  displayOrganisation = true,
  displayState = true,
  displayPeers = true,
  peers,
}: EntryListRowProps) {
  const theme = useTheme()

  const entryKindForRedirect = useMemo(() => {
    return entry.kind === EntryKind.MODEL || entry.kind === EntryKind.MIRRORED_MODEL ? EntryKind.MODEL : entry.kind
  }, [entry])

  const mirroredLabel = useMemo(() => {
    if (entry.kind === EntryKind.MIRRORED_MODEL) {
      return <Typography>Mirrored</Typography>
    }
  }, [entry])

  // Link to view this entry, defaults to 'this' instance
  let href = `${entryKindForRedirect}/${entry.id}`

  // Handle the case where the entry must be viewed on a different peer
  const peerId = entry.peerId
  const isExternal = peerId !== undefined

  if (isExternal && peers && peers.has(peerId)) {
    const peer = peers.get(peerId)
    if (peer) {
      // Override link for peer URL
      href = getEntryUrl(peer.config, entry)
    }
  }

  return (
    <Box
      justifyContent='flex-start'
      alignItems='center'
      sx={{
        px: 3,
        py: 1,
        margin: 'auto',
        ...style,
      }}
      key={entry.id}
    >
      <Stack spacing={1}>
        <Link
          sx={{ textDecoration: 'none', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
          href={href}
          target={isExternal ? '_blank' : '_self'}
        >
          <Stack spacing={1} justifyContent='space-between' alignItems='center' direction='row'>
            <Typography
              variant='h5'
              component='h2'
              sx={{
                fontWeight: '500',
                textDecoration: 'none',
                color: theme.palette.primary.main,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {entry.name}
            </Typography>
            <Stack spacing={2} direction='row'>
              {entry.kind === EntryKind.MIRRORED_MODEL && (
                <Chip size='small' color='secondary' variant='outlined' label={mirroredLabel} />
              )}
              {entry.visibility === 'private' && <Chip size='small' color='secondary' label='Private' />}
            </Stack>
            {isExternal && <LaunchOutlined />}
          </Stack>
          {displayPeers && isExternal && (
            <ChipSelector
              chipTooltipTitle={'Filter by external repository'}
              options={peers ? Array.from(peers.keys()) : []}
              expandThreshold={10}
              variant='outlined'
              multiple
              selectedChips={selectedPeers}
              onChange={onSelectedPeersChange}
              size='small'
              ariaLabel='add external repository to search filter'
              style={{ padding: 1, marginLeft: 'auto' }}
              icon={<CloudQueue />}
            />
          )}
        </Link>
      </Stack>
      <Typography variant='body1' sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {entry.description}
      </Typography>
      <Stack direction='row' spacing={1} alignItems='center' sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Stack direction='row' spacing={1}>
          {displayOrganisation && entry.organisation && (
            <ChipSelector
              chipTooltipTitle={'Filter by organisation'}
              options={[entry.organisation]}
              expandThreshold={10}
              variant='outlined'
              multiple
              selectedChips={selectedOrganisations}
              onChange={onSelectedOrganisationsChange}
              size='small'
              ariaLabel='add tag to search filter'
              icon={<CorporateFare />}
              style={{ padding: 1 }}
            />
          )}
          {displayState && entry.state && (
            <ChipSelector
              chipTooltipTitle={'Filter by state'}
              options={[entry.state]}
              expandThreshold={10}
              variant='outlined'
              multiple
              selectedChips={selectedStates}
              onChange={onSelectedStatesChange}
              size='small'
              ariaLabel='add tag to search filter'
              style={{ padding: 1 }}
            />
          )}
        </Stack>
        {(entry.state || entry.organisation) && (displayOrganisation || displayState) && entry.tags.length > 0 && (
          <Divider flexItem orientation='vertical' />
        )}
        <ChipSelector
          chipTooltipTitle={'Filter by tag'}
          options={entry.tags.slice(0, 10)}
          expandThreshold={10}
          multiple
          selectedChips={selectedChips}
          onChange={onSelectedChipsChange}
          size='small'
          ariaLabel='add tag to search filter'
        />
      </Stack>
    </Box>
  )
}
