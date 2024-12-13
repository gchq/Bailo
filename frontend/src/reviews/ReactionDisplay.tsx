import { Button, Tooltip } from '@mui/material'
import { useGetMultipleUserInformation } from 'actions/user'
import { ReactNode, useMemo } from 'react'
import Loading from 'src/common/Loading'
import { ReactionKindKeys } from 'types/types'
import { plural } from 'utils/stringUtils'

type ReactionDisplayProps = {
  kind: ReactionKindKeys
  icon: ReactNode
  users: string[]
  onReactionClick: (kind: ReactionKindKeys) => void
}

export default function ReactionDisplay({ kind, icon, users, onReactionClick }: ReactionDisplayProps) {
  const { userInformation, isUserInformationLoading } = useGetMultipleUserInformation(users)
  const title = useMemo(() => {
    let text = ''
    if (userInformation) {
      if (userInformation.length > 3) {
        text = `${userInformation[0]}, ${userInformation[1]}, ${userInformation[2]} + ${userInformation.length - 3} more`
      } else {
        userInformation.forEach((user, index) => {
          text += `${user}`
          if (index !== users.length - 1) {
            text += ', '
          }
        })
      }
    }
    //   // if (userList.length > 3) {
    //   //   text = `${userList[0]}, ${userList[1]}, ${userList[2]} + ${userList.length - 3} more`
    //   // } else {
    //   //   userList.forEach((user, index) => {
    //   //     text += `${user}`
    //   //     if (index !== users.length - 1) {
    //   //       text += ', '
    //   //     }
    //   //   })
    //   // }
    return text
  }, [userInformation, users.length])
  if (isUserInformationLoading) {
    return <Loading />
  }
  return (
    <Tooltip title={title}>
      <Button
        size='small'
        aria-label={plural(users.length, kind)}
        onClick={() => onReactionClick(kind)}
        variant='outlined'
        startIcon={icon}
      ></Button>
    </Tooltip>
  )
}
