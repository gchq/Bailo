import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult } from 'actions/model'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Paginate from 'src/common/Paginate'
import EntryListRow from 'src/marketplace/EntryListRow'
import MessageAlert from 'src/MessageAlert'
import { PeerConfigStatus } from 'types/types'

interface EntryListProps {
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

interface RowProps {
  data: EntrySearchResult[]
  index: number
}

type ListRef = {
  resetAfterIndex: (index: number, shouldForceUpdate?: boolean) => void
}

export default function EntryList({
  entries,
  selectedChips,
  onSelectedChipsChange,
  selectedOrganisations,
  onSelectedOrganisationsChange,
  selectedStates,
  onSelectedStatesChange,
  selectedPeers,
  onSelectedPeersChange,
  entriesErrorMessage,
  displayOrganisation = true,
  displayState = true,
  displayPeers = true,
  peers,
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

  if (entriesErrorMessage) return <MessageAlert message={entriesErrorMessage} severity='error' />

  const Row = ({ data, index }: RowProps) => (
    <EntryListRow
      selectedChips={selectedChips}
      onSelectedChipsChange={onSelectedChipsChange}
      selectedOrganisations={selectedOrganisations}
      onSelectedOrganisationsChange={onSelectedOrganisationsChange}
      selectedStates={selectedStates}
      onSelectedStatesChange={onSelectedStatesChange}
      selectedPeers={selectedPeers}
      onSelectedPeersChange={onSelectedPeersChange}
      data={data}
      index={index}
      style={{ padding: theme.spacing(2.5) }}
      displayOrganisation={displayOrganisation}
      displayState={displayState}
      displayPeers={displayPeers}
      peers={peers}
    />
  )

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
    <Box sx={{ py: 2 }}>
      <Paginate
        list={entries}
        searchFilterProperty='name'
        sortingProperties={[
          { value: 'name', title: 'Name', iconKind: 'text' },
          { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
          { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
        ]}
        searchPlaceholderText='Search by name'
        defaultSortProperty='createdAt'
        hideSearchInput
      >
        {Row}
      </Paginate>
    </Box>
  )
}
