import { EntrySearchResult } from 'actions/model'
import { CSSProperties, useLayoutEffect, useState } from 'react'
import { VariableSizeList as List } from 'react-window'
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
  const [windowHeight, setWindowHeight] = useState(0)

  useLayoutEffect(() => {
    function updateWindowHeight() {
      setWindowHeight(window.innerHeight)
    }
    window.addEventListener('resize', updateWindowHeight)
    updateWindowHeight()
    return () => window.removeEventListener('resize', updateWindowHeight)
  }, [])

  if (entriesErrorMessage) return <MessageAlert message={entriesErrorMessage} severity='error' />

  const Row = ({ data, index, style }: RowProps) => (
    <EntryListRow
      selectedChips={selectedChips}
      onSelectedChipsChange={onSelectedChipsChange}
      data={data}
      index={index}
      style={{ padding: '20px', ...style }}
    />
  )

  const columnWidths = entries.map((entry) => (entry.tags.length === 0 ? 100 : 140))

  const getItemSize = (index: number) => columnWidths[index]

  if (entries.length === 0) {
    return (
      <EmptyBlob
        data-test='emptyEntryListBlob'
        text='No items here'
        style={{ height: windowHeight - 230, paddingTop: 40 }}
      />
    )
  }

  return (
    <>
      <List
        height={windowHeight - 230}
        itemCount={entries.length}
        itemData={entries}
        itemSize={getItemSize}
        overscanCount={5}
        width='100%'
      >
        {Row}
      </List>
    </>
  )
}
