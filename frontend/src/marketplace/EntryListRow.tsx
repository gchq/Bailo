import { CorporateFare } from '@mui/icons-material'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult } from 'actions/model'
import { CSSProperties } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import Link from 'src/Link'

interface EntryListRowProps {
  selectedChips: string[]
  onSelectedChipsChange: (chips: string[]) => void
  selectedOrganisations: string[]
  onSelectedOrganisationsChange: (organisations: string[]) => void
  selectedStates: string[]
  onSelectedStatesChange: (states: string[]) => void
  data: EntrySearchResult[]
  index: number
  style: CSSProperties
  displayOrganisation?: boolean
  displayState?: boolean
}

export default function EntryListRow({
  selectedChips,
  onSelectedChipsChange,
  selectedOrganisations,
  onSelectedOrganisationsChange,
  selectedStates,
  onSelectedStatesChange,
  data,
  index,
  style,
  displayOrganisation = true,
  displayState = true,
}: EntryListRowProps) {
  const theme = useTheme()
  const entry = data[index]

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
          href={`${entry.kind}/${entry.id}`}
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
        </Link>
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
      </Stack>
    </Box>
  )
}
