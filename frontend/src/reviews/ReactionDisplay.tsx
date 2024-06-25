import { Button, Tooltip } from '@mui/material'
import { ReactNode, useMemo } from 'react'
import { ReactionKindKeys } from 'types/types'
import { plural } from 'utils/stringUtils'

type ReactionDisplayProps = {
  kind: ReactionKindKeys
  icon: ReactNode
  users: string[]
  onReactionClick: (kind: ReactionKindKeys) => void
}

export default function ReactionDisplay({ kind, icon, users, onReactionClick }: ReactionDisplayProps) {
  const title = useMemo(() => {
    let text = ''
    if (users.length > 3) {
      text = `${users[0]}, ${users[1]}, ${users[2]} + ${users.length - 3} more`
    } else {
      users.forEach((user, index) => {
        text += `${user}`
        if (index !== users.length - 1) {
          text += ', '
        }
      })
    }
    return text
  }, [users])

  return (
    <Tooltip title={title}>
      <Button
        size='small'
        aria-label={plural(users.length, kind)}
        onClick={() => onReactionClick(kind)}
        variant='outlined'
        startIcon={icon}
      >
        {users.length}
      </Button>
    </Tooltip>
  )
}
