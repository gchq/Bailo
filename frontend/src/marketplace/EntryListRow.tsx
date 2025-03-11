import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult } from 'actions/model'
import { CSSProperties } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import Link from 'src/Link'

interface EntryListRowProps {
  selectedChips: string[]
  onSelectedChipsChange: (chips: string[]) => void
  data: EntrySearchResult[]
  index: number
  style: CSSProperties
}

export default function EntryListRow({ selectedChips, onSelectedChipsChange, data, index, style }: EntryListRowProps) {
  const theme = useTheme()
  const entry = data[index]

  return (
    <Box
      justifyContent='flex-start'
      alignItems='center'
      sx={{
        borderBottomStyle: 'solid',
        borderBottomWidth: 1,
        borderBottomColor: theme.palette.divider,
        p: 2,
        margin: 'auto',
        ...style,
      }}
      key={entry.id}
    >
      <Stack>
        <Stack direction='row'>
          <Link
            sx={{ textDecoration: 'none', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
            href={`${entry.kind}/${entry.id}`}
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
        </Stack>
        <Typography
          variant='body1'
          sx={{ marginBottom: 2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
        >
          {entry.description}
        </Typography>
        <div>
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
        </div>
      </Stack>
    </Box>
  )
}
