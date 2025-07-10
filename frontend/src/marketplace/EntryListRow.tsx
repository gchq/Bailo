import { CloudQueue, CorporateFare } from '@mui/icons-material'
import { Box, Chip, Divider, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult } from 'actions/model'
import { CSSProperties } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import Link from 'src/Link'
import { PeerConfigStatus } from 'types/types'
import { getEntryUrl } from 'utils/peerUtils'

interface EntryListRowProps {
  selectedChips: string[]
  onSelectedChipsChange: (chips: string[]) => void
  selectedOrganisations: string[]
  onSelectedOrganisationsChange: (organisations: string[]) => void
  data: EntrySearchResult[]
  index: number
  style: CSSProperties
  peers?: Map<string, PeerConfigStatus>
}

export default function EntryListRow({
  selectedChips,
  onSelectedChipsChange,
  selectedOrganisations,
  onSelectedOrganisationsChange,
  data,
  index,
  style,
  peers,
}: EntryListRowProps) {
  const theme = useTheme()
  const entry = data[index]

  // Link to view this entry, defaults to 'this' instance
  let href = `${entry.kind}/${entry.id}`

  // Handle the case where the entry must be viewed on a different peer
  const peerId = entry.peerId
  if (peerId && peers && peers[peerId]) {
    const peer: PeerConfigStatus = peers[peerId]
    // Override link for peer URL
    href = getEntryUrl(peer.config, entry)
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
        >
          <Typography
            variant='h5'
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
        </Link>
        <Typography variant='body1' sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {entry.description}
        </Typography>
        <Stack direction='row' spacing={1} divider={<Divider flexItem orientation='vertical' />} alignItems='center'>
          {entry.peerId && (
            <Stack direction='row' justifyContent='normal' alignItems='center' spacing={2}>
              <Tooltip title={'Available from ' + entry.peerId}>
                <Chip
                  size={'small'}
                  color={'default'}
                  sx={{ mx: 0.5, mb: 1, ...style }}
                  label={entry.peerId}
                  icon={<CloudQueue />}
                />
              </Tooltip>
            </Stack>
          )}
          {entry.organisation && (
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
      </Stack>
    </Box>
  )
}
