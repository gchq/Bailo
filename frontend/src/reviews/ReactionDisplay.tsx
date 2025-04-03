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

const USER_DISPLAY_LIMIT = 3

export default function ReactionDisplay({ kind, icon, users, onReactionClick }: ReactionDisplayProps) {
  const [usersToDisplay, setUsersToDisplay] = useState('')

  useEffect(() => {
    async function fetchData() {
      const displayNames = await Promise.all(
        users.slice(0, USER_DISPLAY_LIMIT).map(async (user) => {
          const response = await getUserInformation(user)
          if (response.ok) {
            const responseBody = await response.json()
            return responseBody.entity.name
          }
        }),
      )
      setUsersToDisplay(
        users.length > USER_DISPLAY_LIMIT
          ? `${displayNames.join(', ')}, and ${users.length - USER_DISPLAY_LIMIT} ${plural(users.length - USER_DISPLAY_LIMIT, 'other')}`
          : displayNames.join(', '),
      )
    }
    fetchData()
  }, [users])

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
