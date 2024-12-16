import { Button, Tooltip } from '@mui/material'
import { useGetMultipleUserInformation } from 'actions/user'
import { ReactNode, useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { ReactionKindKeys } from 'types/types'
import { plural } from 'utils/stringUtils'

type ReactionDisplayProps = {
  kind: ReactionKindKeys
  icon: ReactNode
  users: string[]
  onReactionClick: (kind: ReactionKindKeys) => void
}

export default function ReactionDisplay({ kind, icon, users, onReactionClick }: ReactionDisplayProps) {
  const { userInformation, isUserInformationLoading, isUserInformationError } = useGetMultipleUserInformation(users)
  const title = useMemo(() => {
    return userInformation && userInformation.length > 3
      ? `${userInformation
          .slice(0, 3)
          .map((user) => user.name)
          .join(', ')}, and ${userInformation.length - 3} others`
      : `${userInformation.map((user) => user.name).join(', ')}`
  }, [userInformation])

  if (isUserInformationError) {
    return <MessageAlert message={isUserInformationError.info.message} severity='error' />
  }

  if (isUserInformationLoading) {
    return <Loading />
  }
  return (
    <Tooltip title={title}>
      <Button
        size='small'
        aria-label={plural(users.length, kind)}
        onClick={() => onReactionClick(kind)}
        startIcon={icon}
      >
        {userInformation.length}
      </Button>
    </Tooltip>
  )
}
