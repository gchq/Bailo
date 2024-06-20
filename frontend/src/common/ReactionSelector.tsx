import { Celebration, InsertEmoticon, ThumbDown, ThumbUp } from '@mui/icons-material'
import { Button, IconButton, Popover, Stack, Tooltip } from '@mui/material'
import { patchResponseReaction } from 'actions/response'
import { useGetCurrentUser } from 'actions/user'
import _ from 'lodash-es'
import { useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { ReactionKind, ReactionKindKeys, ResponseInterface } from 'types/types'

interface ReactionSelectorProps {
  response: ResponseInterface
  mutateResponses: () => void
}

export default function ReactionSelector({ response, mutateResponses }: ReactionSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const handleReactionOnClick = useCallback(
    async (kind: ReactionKindKeys) => {
      const res = await patchResponseReaction(response['_id'], kind)
      if (res.ok) {
        mutateResponses()
        setAnchorEl(null)
      }
    },
    [mutateResponses, response],
  )

  const reactionDisplay = useCallback(
    (kind: ReactionKindKeys, icon: any, users: string[]) => {
      let title = ''
      if (users.length > 3) {
        title = `${users[0]}, ${users[1]}, ${users[2]}, and ${users.length - 3} other users`
      } else {
        users.forEach((user, index) => {
          title += `${user}`
          if (index !== users.length - 1) {
            title += ', '
          }
        })
      }
      return (
        <Tooltip title={title}>
          <Button onClick={() => handleReactionOnClick(kind)} variant='outlined' startIcon={icon}>
            {users.length}
          </Button>
        </Tooltip>
      )
    },
    [handleReactionOnClick],
  )

  const reactionsList = useMemo(() => {
    if (response.reactions) {
      return response.reactions.map((reaction) => {
        if (reaction.users.length > 0) {
          switch (reaction.kind) {
            case ReactionKind.LIKE:
              return reactionDisplay(ReactionKind.LIKE, <ThumbUp fontSize='small' color='secondary' />, reaction.users)
            case ReactionKind.DISLIKE:
              return reactionDisplay(
                ReactionKind.DISLIKE,
                <ThumbDown fontSize='small' color='secondary' />,
                reaction.users,
              )
            case ReactionKind.CELEBRATE:
              return reactionDisplay(
                ReactionKind.CELEBRATE,
                <Celebration fontSize='small' color='secondary' />,
                reaction.users,
              )
          }
        }
      })
    }
  }, [reactionDisplay, response.reactions])

  const isReactionActive = (kind: ReactionKindKeys) => {
    if (!response.reactions || !currentUser) {
      return false
    }
    return response.reactions.find((reaction) => reaction.kind === kind)?.users.includes(currentUser.dn)
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      <Stack direction='row' spacing={1} alignItems='center'>
        <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
          <InsertEmoticon fontSize='small' />
        </IconButton>
        <>{reactionsList}</>
      </Stack>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Stack direction='row' spacing={1} sx={{ p: 1 }}>
          <IconButton onClick={() => handleReactionOnClick(ReactionKind.LIKE)}>
            <ThumbUp fontSize='small' color={isReactionActive(ReactionKind.LIKE) ? 'secondary' : 'inherit'} />
          </IconButton>
          <IconButton onClick={() => handleReactionOnClick(ReactionKind.DISLIKE)}>
            <ThumbDown fontSize='small' color={isReactionActive(ReactionKind.DISLIKE) ? 'secondary' : 'inherit'} />
          </IconButton>
          <IconButton onClick={() => handleReactionOnClick(ReactionKind.CELEBRATE)}>
            <Celebration fontSize='small' color={isReactionActive(ReactionKind.CELEBRATE) ? 'secondary' : 'inherit'} />
          </IconButton>
        </Stack>
      </Popover>
    </>
  )
}
