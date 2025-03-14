import { Undo } from '@mui/icons-material'
import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { Box, Card, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetModelRoles } from 'actions/model'
import { patchResponse } from 'actions/response'
import { useGetSchema } from 'actions/schema'
import { useGetUserInformation } from 'actions/user'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import MessageAlert from 'src/MessageAlert'
import EditableReviewComment from 'src/reviews/EditableReviewComment'
import ReactionButtons from 'src/reviews/ReactionButtons'
import { Decision, EntityKind, ResponseInterface, SplitSchemaNoRender, User } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsFromSchema } from 'utils/formUtils'
import { getRoleDisplay } from 'utils/roles'

type ReviewDecisionDisplayProps = {
  response: ResponseInterface
  modelId: string
  onReplyButtonClick: (value: string) => void
  currentUser: User | undefined
  mutateResponses: () => void
}

export default function ReviewDecisionDisplay({
  response,
  modelId,
  onReplyButtonClick,
  currentUser,
  mutateResponses,
}: ReviewDecisionDisplayProps) {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [comment, setComment] = useState(response.comment || '')
  const [errorMessage, setErrorMessage] = useState('')
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })

  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)
  const { userInformation, isUserInformationLoading, isUserInformationError } = useGetUserInformation(
    response.entity.split(':')[1],
  )
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema('minimal_review_schema_v1')

  const [entityKind, username] = useMemo(() => response.entity.split(':'), [response.entity])

  const handleReactionsError = useCallback((message: string) => {
    setErrorMessage(message)
  }, [])

  useEffect(() => {
    if (!schema) return
    const steps = getStepsFromSchema(schema, {}, [], response.reviewForm)
    for (const step of steps) {
      step.steps = steps
    }
    setSplitSchema({ reference: schema?.id, steps })
  }, [schema])

  const handleReplyOnClick = (value: string | undefined) => {
    setAnchorEl(null)
    if (value) {
      const username = userInformation ? userInformation.name : response.entity.split(':')[1]
      const originalComment = value.replace(/^/gm, '>')
      const quote = `> Replying to **${username}** on **${formatDateString(response.createdAt)}** \n>\n${originalComment}`
      onReplyButtonClick(quote)
    }
  }

  if (isUserInformationError) {
    return <MessageAlert message={isUserInformationError.info.message} severity='error' />
  }

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  if (isSchemaError) {
    return <MessageAlert message={isSchemaError.info.message} severity='error' />
  }

  if (isUserInformationLoading) {
    return <Loading />
  }

  if (isSchemaLoading) {
    return <Loading />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      <Stack direction='row' spacing={2} alignItems='flex-start'>
        <Box mt={1}>
          <UserAvatar entity={{ kind: entityKind as EntityKind, id: username }} size='chip' />
        </Box>
        <Card
          sx={{
            width: '100%',
            p: 1,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems='center'
            sx={{ width: '100%' }}
            justifyContent='space-between'
          >
            <Stack alignItems={{ xs: 'center', sm: 'flex-start' }} spacing={{ xs: 1, sm: 0 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems='center'>
                <Typography data-test='reviewDecisionDisplay'>
                  <UserDisplay dn={username} />
                  {response.decision === Decision.Approve && ' has approved'}
                  {response.decision === Decision.RequestChanges && ' has requested changes'}
                  {response.decision === Decision.Undo && ' has undone their review'}
                </Typography>
                {response.decision === Decision.Approve && <Done color='success' fontSize='small' />}
                {response.decision === Decision.RequestChanges && <HourglassEmpty color='warning' fontSize='small' />}
                {response.decision === Decision.Undo && <Undo fontSize='small' />}
                {response.outdated && (
                  <Typography sx={{ backgroundColor: theme.palette.warning.light, borderRadius: 1, px: 0.5 }}>
                    Outdated
                  </Typography>
                )}
              </Stack>
              {response.role && (
                <Typography variant='caption'>as {getRoleDisplay(response.role, modelRoles)}</Typography>
              )}
            </Stack>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography fontWeight='bold'>{formatDateString(response.createdAt)}</Typography>
              <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} aria-label='Actions'>
                <MoreHorizIcon />
              </IconButton>
            </Stack>
          </Stack>
          <Divider sx={{ mt: 1, mb: 2 }} />
          <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={false} flatSchema />
          <MessageAlert message={errorMessage} severity='error' />
          <ReactionButtons response={response} mutateResponses={mutateResponses} onError={handleReactionsError} />
        </Card>
      </Stack>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleReplyOnClick(comment)}>Reply</MenuItem>
      </Menu>
    </>
  )
}
