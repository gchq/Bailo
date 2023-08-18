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
import React, { useState } from 'react'
import DisabledElementTooltip from 'src/common/DisabledElementTooltip'
import { getErrorMessage } from 'utils/fetcher'

import { postEndpoint } from '../data/api'
import { ApprovalCategory, ApprovalFilterType, useGetNumApprovals, useListApprovals } from '../data/approvals'
import EmptyBlob from '../src/common/EmptyBlob'
import MultipleErrorWrapper from '../src/errors/MultipleErrorWrapper'
import Wrapper from '../src/Wrapper'
import { Approval, ApprovalStates, ModelDoc, Version } from '../types/types'

function ErrorWrapper({ message }: { message: string | undefined }) {
  return (
    <Paper sx={{ mt: 2, mb: 2 }}>
      <Alert severity='error'>{message || 'Unable to communicate with server.'}</Alert>
    </Paper>
  )
}

function ApprovalList({ category, filter }: { category: ApprovalCategory; filter: ApprovalFilterType }) {
  const { approvals, isApprovalsLoading, isApprovalsError, mutateApprovals } = useListApprovals(category, filter)

  console.log(approvals)
  const error = MultipleErrorWrapper(
    `Unable to load approval page`,
    {
      isApprovalsError,
    },
    ErrorWrapper
  )
  if (error) return error

  const getUploadCategory = (approvalCategory: ApprovalCategory) =>
    approvalCategory === 'Upload' ? 'models' : 'deployments'

  if (isApprovalsLoading || !approvals) {
    return <Paper sx={{ mt: 2, mb: 2 }} />
  }
  return (
    <Paper sx={{ mt: 2, mb: 2, pb: 2 }}>
      <Typography sx={{ p: 3 }} variant='h4'>
        {category === 'Upload' ? 'Models' : 'Deployments'}
      </Typography>
      {approvals.map((approval: any) => (
        <ApprovalItem
          approval={approval}
          category={approval.approvalCategory}
          version={approval.version}
          key={approval._id}
          mutateApprovals={mutateApprovals}
        />
      ))}

      {approvals.length === 0 && (
        <EmptyBlob text={`All done! No ${getUploadCategory(category)} are waiting for approval.`} />
      )}
    </Paper>
  )
}

type ApprovalItemProps = {
  approval: any
  category: string
  version: Version
  mutateApprovals: () => void
}

function ApprovalItem({ approval, category, mutateApprovals }: ApprovalItemProps) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState('')
  const [getapproval, setGetApproval] = useState<Approval | undefined>(undefined)
  const [approvalModalText, setApprovalModalText] = useState('')
  const [approvalModalTitle, setApprovalModalTitle] = useState('')
  const [showAlert, setShowAlert] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { mutateNumApprovals } = useGetNumApprovals()
  const theme = useTheme()

  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(
    (approval.version?.model as ModelDoc)?.schemaRef || (approval.deployment?.model as ModelDoc)?.schemaRef
  )

  const reviewer = schema?.schema.properties.contacts.properties.reviewer.title
  if (isSchemaError) {
    return <ErrorWrapper message={isSchemaError.info.message} />
  }

  if (isSchemaLoading) {
    return null
  }

  function canApprove() {
    if (!approval.version || approval.approvalType === 'Reviewer') {
      return true
    } else {
      return approval.approvalType === 'Manager' && approval.version.reviewerApproved === ApprovalStates.Accepted
        ? true
        : false
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
    setShowAlert(false)
    setErrorMessage('')
  }

  const onConfirm = async () => {
    await postEndpoint(`/api/v1/approval/${getapproval?._id}/respond`, { choice }).then(async (res) => {
      if (res.status >= 400) {
        const errorResponse = await getErrorMessage(res)
        setShowAlert(true)
        setErrorMessage(errorResponse)
      } else {
        mutateApprovals()
        mutateNumApprovals()
        setOpen(false)
      }
    })
  }

  const managerStyling = {
    mb: 2,
    borderLeft: '.3rem solid #283593',
    p: 2,
    backgroundColor: theme.palette.container.main,
  }
  const reviewerStyling = {
    mb: 2,
    borderLeft: '.3rem solid #de3c30',
    p: 2,
    backgroundColor: theme.palette.container.main,
  }

  const changeState = (changeStateChoice: string, changeStateApproval: Approval) => {
    setOpen(true)
    setGetApproval(changeStateApproval)
    setChoice(changeStateChoice)
    setShowAlert(false)
    if (changeStateChoice === 'Accepted') {
      setApprovalModalTitle(`Approve ${category}`)
      setApprovalModalText(`I can confirm that the ${category.toLowerCase()} meets all necessary requirements.`)
    } else {
      setApprovalModalTitle(`Reject ${category}`)
      setApprovalModalText(`The ${category.toLowerCase()} does not meet the necessary requirements for approval.`)
    }
  }
  return (
    <>
      {approval && (
        <>
          <Box sx={{ px: 3 }} key={approval._id}>
            <Grid container spacing={1} sx={approval.approvalType === 'Manager' ? managerStyling : reviewerStyling}>
              <Grid item xs={9}>
                {category === 'Upload' && (
                  <>
                    <Link href={`/model/${approval.version?.model?.uuid}`} passHref legacyBehavior>
                      <MuiLink
                        variant='h5'
                        sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                      >
                        {approval.version?.metadata?.highLevelDetails?.name}
                      </MuiLink>
                    </Link>
                    <Stack direction='row' spacing={2}>
                      <Chip color='primary' label={approval.approvalType} size='small' />
                      <Chip color='primary' label={`Version: ${approval.version?.version}`} size='small' />
                      <Box sx={{ mt: 'auto !important', mb: 'auto !important' }}>
                        <Typography>{approval.version?.metadata?.highLevelDetails?.modelInASentence}</Typography>
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
                {category === 'Deployment' && (
                  <>
                    <Link href={`/deployment/${approval.deployment?.uuid}`} passHref legacyBehavior>
                      <MuiLink
                        variant='h5'
                        sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                      >
                        {approval.deployment?.metadata?.highLevelDetails?.name}
                      </MuiLink>
                    </Link>
                    <Typography>
                      Requesting deployment of{' '}
                      <Link href={`/model/${approval.deployment?.model?.uuid}`} passHref legacyBehavior>
                        <MuiLink
                          sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                        >
                          {approval.deployment?.model?.latestVersion?.metadata?.highLevelDetails?.name}
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
                    onClick={() => changeState('Declined', approval)}
                    sx={{ mr: 1 }}
                    disabled={approval.status === 'Declined'}
                  >
                    Reject
                  </Button>
                  <DisabledElementTooltip
                    conditions={[!canApprove() ? `${reviewer} needs to appove this model first` : '']}
                  >
                    <Button
                      variant='contained'
                      onClick={() => changeState('Accepted', approval)}
                      data-test={`approveButton${approval.approvalType}${
                        category === 'Upload' ? approval.version?.model?.uuid : approval.deployment?.uuid
                      }`}
                      disabled={approval.status === 'Accepted' || !canApprove()}
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
      )}
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
      <ApprovalList category='Upload' filter={value} />
      <ApprovalList category='Deployment' filter={value} />
    </Wrapper>
  )
}
