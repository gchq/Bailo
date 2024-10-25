import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import { useMemo } from 'react'
import { CollaboratorEntry } from 'types/types'

type EntityIconProps = {
  entryCollaborator: CollaboratorEntry
}

export default function EntityIcon({ entryCollaborator }: EntityIconProps) {
  const isUser = useMemo(() => entryCollaborator.entity.startsWith('user:'), [entryCollaborator])
  return isUser ? <PersonIcon color='primary' /> : <GroupsIcon color='secondary' />
}
