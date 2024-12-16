import {
  CelebrationTwoTone,
  FavoriteTwoTone,
  InsertEmoticon,
  ThumbDownTwoTone,
  ThumbUpTwoTone,
} from '@mui/icons-material'
import { IconButton, Popover, Stack } from '@mui/material'
import { patchResponseReaction } from 'actions/response'
import { useGetCurrentUser } from 'actions/user'
import _ from 'lodash-es'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import ReactionDisplay from 'src/reviews/ReactionDisplay'
import { ReactionKind, ReactionKindKeys, ResponseInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface ReactionButtonsProps {
  response: ResponseInterface
  mutateResponses: () => void
  onError: (message: string) => void
}

export default function ReactionButtons({ response, mutateResponses, onError }: ReactionButtonsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  useEffect(() => {
    if (isCurrentUserError) {
      onError(isCurrentUserError.info.message)
    }
  }, [isCurrentUserError, onError])

  const handleReactionClick = useCallback(
    async (kind: ReactionKindKeys) => {
      const res = await patchResponseReaction(response['_id'], kind)
      if (!res.ok) {
        onError(await getErrorMessage(res))
      }
      mutateResponses()
      setAnchorEl(null)
    },
    [mutateResponses, onError, response],
  )

  const reactionsList = useMemo(
    () =>
      response.reactions
        ? response.reactions.reduce<ReactNode[]>((activeReactions, reaction) => {
            if (reaction.users.length > 0) {
              switch (reaction.kind) {
                case ReactionKind.LIKE:
                  activeReactions.push(
                    <ReactionDisplay
                      kind={ReactionKind.LIKE}
                      icon={<ThumbUpTwoTone fontSize='small' />}
                      users={reaction.users}
                      onReactionClick={handleReactionClick}
                    />,
                  )
                  break
                case ReactionKind.DISLIKE:
                  activeReactions.push(
                    <ReactionDisplay
                      kind={ReactionKind.DISLIKE}
                      icon={<ThumbDownTwoTone fontSize='small' />}
                      users={reaction.users}
                      onReactionClick={handleReactionClick}
                    />,
                  )
                  break
                case ReactionKind.HEART:
                  activeReactions.push(
                    <ReactionDisplay
                      kind={ReactionKind.CELEBRATE}
                      icon={<FavoriteTwoTone fontSize='small' />}
                      users={reaction.users}
                      onReactionClick={handleReactionClick}
                    />,
                  )
                  break
                case ReactionKind.CELEBRATE:
                  activeReactions.push(
                    <ReactionDisplay
                      kind={ReactionKind.CELEBRATE}
                      icon={<CelebrationTwoTone fontSize='small' />}
                      users={reaction.users}
                      onReactionClick={handleReactionClick}
                    />,
                  )
                  break
              }
            }
            return activeReactions
          }, [])
        : [],
    [handleReactionClick, response.reactions],
  )

  const isReactionActive = (kind: ReactionKindKeys) => {
    if (!response.reactions || !currentUser) {
      return false
    }
    return !!response.reactions.find((reaction) => reaction.kind === kind)?.users.includes(currentUser.dn)
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems='center'>
        <IconButton aria-label='Add reaction' color='primary' onClick={(event) => setAnchorEl(event.currentTarget)}>
          <InsertEmoticon fontSize='small' />
        </IconButton>
        {reactionsList}
      </Stack>
      <Popover
        open={!!anchorEl}
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
          <IconButton onClick={() => handleReactionClick(ReactionKind.LIKE)}>
            <ThumbUpTwoTone fontSize='small' color={isReactionActive(ReactionKind.LIKE) ? 'primary' : 'inherit'} />
          </IconButton>
          <IconButton onClick={() => handleReactionClick(ReactionKind.DISLIKE)}>
            <ThumbDownTwoTone fontSize='small' color={isReactionActive(ReactionKind.DISLIKE) ? 'primary' : 'inherit'} />
          </IconButton>
          <IconButton onClick={() => handleReactionClick(ReactionKind.HEART)}>
            <FavoriteTwoTone fontSize='small' color={isReactionActive(ReactionKind.HEART) ? 'primary' : 'inherit'} />
          </IconButton>
          <IconButton onClick={() => handleReactionClick(ReactionKind.CELEBRATE)}>
            <CelebrationTwoTone
              fontSize='small'
              color={isReactionActive(ReactionKind.CELEBRATE) ? 'primary' : 'inherit'}
            />
          </IconButton>
        </Stack>
      </Popover>
    </>
  )
}
