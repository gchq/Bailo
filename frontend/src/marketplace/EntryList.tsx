import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult } from 'actions/model'
import { CSSProperties } from 'react'
import { FixedSizeList } from 'react-window'
import ChipSelector from 'src/common/ChipSelector'
import EmptyBlob from 'src/common/EmptyBlob'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'

interface EntryListProps {
  entries: EntrySearchResult[]
  selectedChips: string[]
  onSelectedChipsChange: (chips: string[]) => void
  entriesErrorMessage?: string
}

export default function EntryList({
  entries,
  selectedChips,
  onSelectedChipsChange,
  entriesErrorMessage,
}: EntryListProps) {
  const theme = useTheme()

  const rows = ({ data, index, style }: { data: EntrySearchResult[]; index: number; style: CSSProperties }) => {
    const entry = data[index]

    return (
      <Box
        justifyContent='flex-start'
        alignItems='center'
        sx={{
          backgroundColor: index % 2 ? theme.palette.container.main : theme.palette.background.paper,
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
                sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.primary.main }}
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

  if (entriesErrorMessage) return <MessageAlert message={entriesErrorMessage} severity='error' />

  return (
    <>
      {entries.length === 0 && <EmptyBlob data-test='emptyEntryListBlob' text='No entries here' />}
      <FixedSizeList
        height={window.innerHeight - 300}
        itemCount={entries.length}
        itemData={entries}
        itemSize={130}
        overscanCount={5}
        width='100%'
      >
        {rows}
      </FixedSizeList>
    </>
  )
}
