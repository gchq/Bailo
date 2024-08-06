import Dangerous from '@mui/icons-material/DangerousOutlined'
import { Chip } from '@mui/material'
import { CollaboratorEntry } from 'types/types'

type EntryCardChipSetProps = {
  entryCollaborator: CollaboratorEntry
}

export default function EntryCardRolesChipSet({ entryCollaborator }: EntryCardChipSetProps) {
  return entryCollaborator.roles.length === 0 ? (
    <Chip
      variant='outlined'
      style={{ marginRight: 2, marginBottom: 2, backgroundColor: '#B00020', color: 'white', alignContent: 'center' }}
      icon={<Dangerous style={{ color: 'white' }} />}
      label='No Roles'
    />
  ) : (
    entryCollaborator.roles.map((role) => {
      return <Chip key={role} variant='outlined' style={{ marginRight: 2, marginBottom: 2 }} label={role} />
    })
  )
}
