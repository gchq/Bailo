import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useGetSchema } from 'data/schema'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import DisabledElementTooltip from 'src/common/DisabledElementTooltip'
import Loading from 'src/common/Loading'
import { getErrorMessage } from 'utils/fetcher'

import { postEndpoint } from '../data/api'
import { ApprovalFilterType, useGetNumApprovals, useListApprovals } from '../data/approvals'
import EmptyBlob from '../src/common/EmptyBlob'
import Wrapper from '../src/Wrapper'
import {
  Approval,
  ApprovalCategory,
  ApprovalStates,
  DeploymentDoc,
  ModelDoc,
  UploadCategory,
  VersionDoc,
} from '../types/types'

function ErrorWrapper({ message }: { message: string | undefined }) {
  return (
    <Paper sx={{ mt: 2, mb: 2 }}>
      <Alert severity='error'>{message || 'Unable to communicate with server.'}</Alert>
    </Paper>
  )
}

function ApprovalList({
  approvalCategory,
  filter,
}: {
  approvalCategory: ApprovalCategory
  filter: ApprovalFilterType
}) {
  const { approvals, isApprovalsLoading, isApprovalsError } = useListApprovals(approvalCategory, filter)

  const uploadCategory: UploadCategory = useMemo(
    () => (approvalCategory === ApprovalCategory.Upload ? 'model' : 'deployment'),
    [approvalCategory],
  )

  if (isApprovalsError) {
    return <ErrorWrapper message={isApprovalsError.info.message} />
  }

  if (isApprovalsLoading) {
    return <Loading />
  }

  return (
    <Paper sx={{ mt: 2, mb: 2, pb: 2 }}>
      <Typography component='h2' variant='h5' sx={{ p: 3 }}>
        {approvalCategory === ApprovalCategory.Upload ? 'Models' : 'Deployments'}
      </Typography>
      {approvals.map((approval) => (
        <ApprovalItem
          approval={approval}
          approvalCategory={approval.approvalCategory}
          filter={filter}
          key={approval._id}
        />
      ))}
      {approvals.length === 0 && <EmptyBlob text={`No ${uploadCategory}s awaiting approval.`} />}
    </Paper>
  )
}

type ApprovalItemProps = {
  approval: Approval
  approvalCategory: ApprovalCategory
  filter: ApprovalFilterType
}

function ApprovalItem({ approval, approvalCategory, filter }: ApprovalItemProps) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState('')
  const [approvalModalText, setApprovalModalText] = useState('')
  const [approvalModalTitle, setApprovalModalTitle] = useState('')
  const [showAlert, setShowAlert] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { mutateApprovals } = useListApprovals(approvalCategory, filter)
  const { mutateNumApprovals } = useGetNumApprovals()
  const theme = useTheme()

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(
    ((approval.version as VersionDoc)?.model as ModelDoc)?.schemaRef ||
      ((approval.deployment as DeploymentDoc)?.model as ModelDoc)?.schemaRef,
  )

  const reviewer: string = useMemo(
    () => (schema ? schema.schema.properties.contacts.properties.reviewer.title : ''),
    [schema],
  )

  const canApprove = useMemo(() => {
    if (!approval.version || approval.approvalType === 'Reviewer') {
      return true
    }
    return (
      approval.approvalType === 'Manager' &&
      (approval.version as VersionDoc).reviewerApproved === ApprovalStates.Accepted
    )
  }, [approval.approvalType, approval.version])

  const gridContainerStyling = useMemo(
    () => ({
      mb: 2,
      p: 2,
      backgroundColor: theme.palette.container.main,
      borderLeft: `.3rem solid ${approval.approvalType === 'Manager' ? '#283593' : '#de3c30'}`,
    }),
    [approval.approvalType, theme],
  )

  const handleClose = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
    setShowAlert(false)
    setErrorMessage('')
  }

  const onConfirm = async () => {
    await postEndpoint(`/api/v1/approval/${approval?._id}/respond`, { choice }).then(async (res) => {
      if (res.status >= 400) {
        setErrorMessage(await getErrorMessage(res))
        setShowAlert(true)
      } else {
        mutateApprovals()
        mutateNumApprovals()
        setOpen(false)
      }
    })
  }

  const changeState = (changeStateChoice: string) => {
    setOpen(true)

    setChoice(changeStateChoice)
    setShowAlert(false)
    if (changeStateChoice === 'Accepted') {
      setApprovalModalTitle(`Approve ${approvalCategory}`)
      setApprovalModalText(`I can confirm that the ${approvalCategory.toLowerCase()} meets all necessary requirements.`)
    } else {
      setApprovalModalTitle(`Reject ${approvalCategory}`)
      setApprovalModalText(
        `The ${approvalCategory.toLowerCase()} does not meet the necessary requirements for approval.`,
      )
    }
  }

  if (isSchemaError) {
    return <ErrorWrapper message={isSchemaError.info.message} />
  }

  if (isSchemaLoading || !schema) {
    return <Loading />
  }

  return (
    <>
      <Box sx={{ px: 3 }} key={approval._id}>
        <Grid container spacing={1} sx={gridContainerStyling}>
          <Grid item xs={9}>
            {approvalCategory === 'Upload' && (
              <>
                <Link
                  href={`/model/${((approval.version as VersionDoc)?.model as ModelDoc)?.uuid}`}
                  passHref
                  legacyBehavior
                >
                  <MuiLink
                    variant='h5'
                    sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                  >
                    {(approval.version as VersionDoc)?.metadata?.highLevelDetails?.name}
                  </MuiLink>
                </Link>
                <Stack direction='row' spacing={2}>
                  <Chip color='primary' label={approval.approvalType} size='small' />
                  <Chip color='primary' label={`Version: ${(approval.version as VersionDoc)?.version}`} size='small' />
                  <Box sx={{ mt: 'auto !important', mb: 'auto !important' }}>
                    <Typography>
                      {(approval.version as VersionDoc)?.metadata?.highLevelDetails?.modelInASentence}
                    </Typography>
                  </Box>
                </Stack>
                {approval.version === undefined ||
                  (approval.version === null && (
                    <Alert sx={{ mt: 2 }} severity='warning'>
                      This model appears to have data missing - check with the uploader to make sure it was uploaded
                      correctly
                    </Alert>
                  ))}
              </>
            )}
            {approvalCategory === 'Deployment' && (
              <>
                <Link href={`/deployment/${(approval.deployment as DeploymentDoc)?.uuid}`} passHref legacyBehavior>
                  <MuiLink
                    variant='h5'
                    sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                  >
                    {(approval.deployment as DeploymentDoc)?.metadata?.highLevelDetails?.name}
                  </MuiLink>
                </Link>
                <Typography>
                  Requesting deployment of{' '}
                  <Link
                    href={`/model/${((approval.deployment as DeploymentDoc)?.model as ModelDoc)?.uuid}`}
                    passHref
                    legacyBehavior
                  >
                    <MuiLink sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}>
                      {
                        (((approval.deployment as DeploymentDoc)?.model as ModelDoc)?.latestVersion as VersionDoc)
                          ?.metadata?.highLevelDetails?.name
                      }
                    </MuiLink>
                  </Link>
                </Typography>
                {approval.deployment === undefined ||
                  (approval.deployment === null && (
                    <Alert sx={{ mt: 2 }} severity='warning'>
                      This deployment appears to have data missing - check with the requester to make sure it was
                      requested correctly
                    </Alert>
                  ))}
              </>
            )}
          </Grid>
          <Grid item xs={12} md sx={{ display: 'flex' }}>
            <Box ml='auto' my='auto'>
              {approval.status !== 'No Response' && (
                <Chip label={approval.status} color={approval.status === 'Accepted' ? 'success' : 'error'} />
              )}
            </Box>
          </Grid>
          <Grid item sx={{ display: 'flex', width: 200 }}>
            <Box ml='auto' my='auto'>
              <Button
                color='secondary'
                variant='outlined'
                onClick={() => changeState('Declined')}
                sx={{ mr: 1 }}
                disabled={approval.status === 'Declined'}
              >
                Reject
              </Button>
              <DisabledElementTooltip
                display='inline-flex'
                conditions={[!canApprove ? `${reviewer} needs to approve this model first` : '']}
              >
                <Button
                  variant='contained'
                  onClick={() => changeState('Accepted')}
                  data-test={`approveButton${approval.approvalType}${
                    approvalCategory === 'Upload'
                      ? ((approval.version as VersionDoc)?.model as ModelDoc)?.uuid
                      : (approval.deployment as DeploymentDoc)?.uuid
                  }`}
                  disabled={approval.status === 'Accepted' || !canApprove}
                >
                  Approve
                </Button>
              </DisabledElementTooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle id='alert-dialog-title'>{approvalModalTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{approvalModalText}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' variant='outlined' onClick={onCancel}>
            Cancel
          </Button>
          <Button variant='contained' onClick={onConfirm} autoFocus data-test='confirmReviewButton'>
            Confirm
          </Button>
        </DialogActions>
        {showAlert && (
          <Alert sx={{ m: 1 }} severity='error' onClose={() => setShowAlert(false)}>
            {errorMessage}
          </Alert>
        )}
      </Dialog>
    </>
  )
}

export default function Review() {
  const [value, setValue] = useState<ApprovalFilterType>('user')

  const handleChange = (_event: React.SyntheticEvent, newValue: ApprovalFilterType) => {
    setValue(newValue)
  }

  return (
    <Wrapper title='Reviews' page='review'>
      <Tabs value={value} onChange={handleChange}>
        <Tab value='user' label='Approvals' />
        <Tab value='archived' label='Archived' />
      </Tabs>
      <ApprovalList approvalCategory={ApprovalCategory.Upload} filter={value} />
      <ApprovalList approvalCategory={ApprovalCategory.Deployment} filter={value} />
    </Wrapper>
  )
}
