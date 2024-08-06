import { Chip } from '@mui/material'
import { CollaboratorEntry } from 'types/types'

type EntryCardChipSetProps = {
  entryCollaborator: CollaboratorEntry
}

export default function EntryCardRolesChipSet({ entryCollaborator }: EntryCardChipSetProps) {
  return entryCollaborator.roles.length === 0 ? (
    <Chip style={{ marginRight: 2, marginBottom: 2, color: 'red', fontWeight: 'bold' }} label='no roles' />
  ) : (
    entryCollaborator.roles.map((role) => {
      return <Chip key={role} style={{ marginRight: 2, marginBottom: 2 }} label={role} />
    })
  )
}
