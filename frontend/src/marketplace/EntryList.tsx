import { useTheme } from '@mui/material/styles'
import { EntrySearchResult } from 'actions/model'
import { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { VariableSizeList } from 'react-window'
import EmptyBlob from 'src/common/EmptyBlob'
import EntryListRow from 'src/marketplace/EntryListRow'
import MessageAlert from 'src/MessageAlert'

interface EntryListProps {
  entries: EntrySearchResult[]
  selectedChips: string[]
  onSelectedChipsChange: (chips: string[]) => void
  entriesErrorMessage?: string
}

interface RowProps {
  data: EntrySearchResult[]
  index: number
  style: CSSProperties
}

type ListRef = {
  resetAfterIndex: (index: number, shouldForceUpdate?: boolean) => void
}

export default function EntryList({
  entries,
  selectedChips,
  onSelectedChipsChange,
  entriesErrorMessage,
}: EntryListProps) {
  const [windowHeight, setWindowHeight] = useState(0)

  const theme = useTheme()
  const ref = useRef<ListRef>(null)

  useLayoutEffect(() => {
    function updateWindowHeight() {
      setWindowHeight(window.innerHeight)
    }
    window.addEventListener('resize', updateWindowHeight)
    updateWindowHeight()
    return () => window.removeEventListener('resize', updateWindowHeight)
  }, [])

  useEffect(() => {
    if (entries && ref) {
      ref.current?.resetAfterIndex(0)
    }
  }, [entries, ref])

  const columnWidths = useMemo(() => entries.map((entry) => (entry.tags.length === 0 ? 100 : 140)), [entries])

  if (entriesErrorMessage) return <MessageAlert message={entriesErrorMessage} severity='error' />

  const Row = ({ data, index, style }: RowProps) => (
    <EntryListRow
      selectedChips={selectedChips}
      onSelectedChipsChange={onSelectedChipsChange}
      data={data}
      index={index}
      style={{ padding: theme.spacing(2.5), ...style }}
    />
  )

  const getItemSize = (index: number) => columnWidths[index]

  if (entries.length === 0) {
    return (
      <EmptyBlob
        data-test='emptyEntryListBlob'
        text='No items found'
        style={{ height: windowHeight - 230, paddingTop: theme.spacing(5) }}
      />
    )
  }

  return (
    <>
      <VariableSizeList
        ref={ref}
        height={windowHeight - 230}
        itemCount={entries.length}
        itemData={entries}
        itemSize={getItemSize}
        overscanCount={5}
        width='100%'
      >
        {Row}
      </VariableSizeList>
    </>
  )
}
