import { Typography } from '@mui/material'
import { useMemo } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import { CollaboratorEntry, EntityKind } from 'types/types'

type EntityNameDisplayProps = {
  entryCollaborator: CollaboratorEntry
}

export default function EntityNameDisplay({ entryCollaborator }: EntityNameDisplayProps) {
  const [entryCollaboratorKind, entryCollaboratorName] = useMemo(
    () => entryCollaborator.entity.split(':'),
    [entryCollaborator],
  )
  return entryCollaboratorKind === EntityKind.USER || entryCollaboratorKind === EntityKind.GROUP ? (
    <UserDisplay dn={entryCollaboratorName} />
  ) : (
    <Typography fontWeight='bold'>{entryCollaboratorName}</Typography>
  )
}
