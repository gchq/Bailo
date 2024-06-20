import { InsertEmoticon, ThumbDown, ThumbUp } from '@mui/icons-material'
import { IconButton, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
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
  const theme = useTheme()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const reactionDisplay = useCallback(
    (icon: any, users: string[]) => {
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
          <Stack
            sx={{
              borderStyle: 'solid',
              borderWidth: '1px',
              borderRadius: 4,
              borderColor: theme.palette.primary.main,
              py: 0.5,
              px: 1,
            }}
            spacing={1}
            direction='row'
            alignItems='center'
          >
            {icon}
            <Typography>{users.length}</Typography>
          </Stack>
        </Tooltip>
      )
    },
    [theme.palette.primary.main],
  )

  const reactionsList = useMemo(() => {
    if (response.reactions) {
      return response.reactions.map((reaction) => {
        if (reaction.users.length > 0) {
          switch (reaction.kind) {
            case ReactionKind.LIKE:
              return reactionDisplay(<ThumbUp fontSize='small' color='secondary' />, reaction.users)
            case ReactionKind.DISLIKE:
              return reactionDisplay(<ThumbDown fontSize='small' color='secondary' />, reaction.users)
          }
        }
      })
    }
  }, [reactionDisplay, response.reactions])

  const handleReactionOnClick = async (kind: ReactionKindKeys) => {
    const res = await patchResponseReaction(response['_id'], kind)
    if (res.ok) {
      mutateResponses()
      setAnchorEl(null)
    }
  }

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
        <Stack direction='row'>
          <IconButton onClick={() => handleReactionOnClick(ReactionKind.LIKE)}>
            <ThumbUp color={isReactionActive(ReactionKind.LIKE) ? 'secondary' : 'inherit'} />
          </IconButton>
          <IconButton onClick={() => handleReactionOnClick(ReactionKind.DISLIKE)}>
            <ThumbDown color={isReactionActive(ReactionKind.DISLIKE) ? 'secondary' : 'inherit'} />
          </IconButton>
        </Stack>
      </Popover>
    </>
  )
}
