import { EntrySearchResult } from 'actions/model'
import { CSSProperties } from 'react'
import { FixedSizeList } from 'react-window'
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

export default function EntryList({
  entries,
  selectedChips,
  onSelectedChipsChange,
  entriesErrorMessage,
}: EntryListProps) {
  if (entriesErrorMessage) return <MessageAlert message={entriesErrorMessage} severity='error' />

  const Row = ({ data, index, style }: RowProps) => (
    <EntryListRow
      selectedChips={selectedChips}
      onSelectedChipsChange={onSelectedChipsChange}
      data={data}
      index={index}
      style={style}
    />
  )

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
        {Row}
      </FixedSizeList>
    </>
  )
}
