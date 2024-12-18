import { Button, Tooltip } from '@mui/material'
import { getUserInformation } from 'actions/user'
import { ReactNode, useEffect, useState } from 'react'
import { ReactionKindKeys } from 'types/types'
import { plural } from 'utils/stringUtils'

type ReactionDisplayProps = {
  kind: ReactionKindKeys
  icon: ReactNode
  users: string[]
  onReactionClick: (kind: ReactionKindKeys) => void
}

export default function ReactionDisplay({ kind, icon, users, onReactionClick }: ReactionDisplayProps) {
  const [usersToDisplay, setUsersToDisplay] = useState('')

  useEffect(() => {
    async function fetchData() {
      if (!usersToDisplay) {
        setUsersToDisplay(
          `${users
            .slice(0, 3)
            .map(async (user) => {
              const response = await getUserInformation(user)
              if (response.ok) {
                const responseBody = await response.json()
                return responseBody.entity.name
              }
            })
            .join(', ')} ${users.length > 3 ? ` and ${users.length - 3} others` : ''}`,
        )
      }
    }
    fetchData()
  }, [users, usersToDisplay])

  return (
    <Tooltip title={usersToDisplay}>
      <Button
        size='small'
        aria-label={plural(users.length, kind)}
        onClick={() => onReactionClick(kind)}
        startIcon={icon}
      >
        {users.length}
      </Button>
    </Tooltip>
  )
}
