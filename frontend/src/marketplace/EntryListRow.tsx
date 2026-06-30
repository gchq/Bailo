import CloudQueue from '@mui/icons-material/CloudQueue'
import CorporateFare from '@mui/icons-material/CorporateFare'
import LaunchOutlined from '@mui/icons-material/LaunchOutlined'
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult } from 'actions/entry'
import { CSSProperties, useMemo, useState } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import Link from 'src/Link'
import { EntryKind, PeerConfigStatus } from 'types/types'
import { getEntryUrl } from 'utils/peerUtils'
import { entryKindForRedirect } from 'utils/routerUtils'

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

const descriptionTextLimit = 170

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
  const [expanded, setExpanded] = useState(false)

  const label = useMemo(() => {
    switch (entry.kind) {
      case EntryKind.MIRRORED_MODEL:
        return <Chip size='small' color='secondary' variant='outlined' label='Mirrored' />
      case EntryKind.UNTRUSTED_MODEL:
        return <Chip size='small' color='warning' variant='outlined' label='Untrusted' />
    }
  }, [entry])

  // Link to view this entry, defaults to 'this' instance
  let href = `${entryKindForRedirect(entry.kind)}/${entry.id}`

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
      key={entry.id}
      sx={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        px: 3,
        py: 1,
        margin: 'auto',
        ...style,
      }}
    >
      <Stack spacing={1}>
        <Link
          sx={{ textDecoration: 'none', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
          href={href}
          target={isExternal ? '_blank' : '_self'}
        >
          <Stack
            spacing={1}
            direction='row'
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
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
              {label}
              {entry.visibility === 'private' && <Chip size='small' color='secondary' label='Private' />}
              {isExternal && <LaunchOutlined />}
            </Stack>
          </Stack>
          {displayPeers && isExternal && (
            <ChipSelector
              chipTooltipTitle={'Filter by external repository'}
              options={peers && entry?.peerId && peers.has(entry.peerId) ? [entry.peerId] : []}
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
        <>
          {!expanded &&
            `${entry.description.slice(0, descriptionTextLimit)}${entry.description.length > descriptionTextLimit ? '...' : ''}`}
          {expanded && entry.description}
          {entry.description.length > descriptionTextLimit && (
            <Button sx={{ width: 'max-content' }} onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : 'Show more...'}
            </Button>
          )}
        </>
        <Stack
          direction='row'
          spacing={1}
          sx={{ flexWrap: 'wrap', rowGap: 1 }}
          divider={<Divider flexItem orientation='vertical' />}
        >
          <Box>
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
          </Box>
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
            />
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
