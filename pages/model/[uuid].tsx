import EditIcon from '@mui/icons-material/EditTwoTone'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/FavoriteTwoTone'
import DownArrow from '@mui/icons-material/KeyboardArrowDownTwoTone'
import UpArrow from '@mui/icons-material/KeyboardArrowUpTwoTone'
import PostAddIcon from '@mui/icons-material/PostAddTwoTone'
import RestartAlt from '@mui/icons-material/RestartAltTwoTone'
import UploadIcon from '@mui/icons-material/UploadTwoTone'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MuiLink from '@mui/material/Link'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import copy from 'copy-to-clipboard'
import { postEndpoint, putEndpoint, deleteEndpoint } from 'data/api'
import { useGetVersionAccess } from 'data/version'
import { useGetModelDeployments, useGetModelVersion, useGetModelVersions } from 'data/model'
import { useGetCurrentUser } from 'data/user'
import { Types } from 'mongoose'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Elements } from 'react-flow-renderer'
import UserAvatar from 'src/common/UserAvatar'
import ModelOverview from 'src/ModelOverview'
import TerminalLog from 'src/TerminalLog'
import Wrapper from 'src/Wrapper'
import createComplianceFlow from 'utils/complianceFlow'
import { getErrorMessage } from '../../utils/fetcher'
import ApprovalsChip from '../../src/common/ApprovalsChip'
import EmptyBlob from '../../src/common/EmptyBlob'
import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import { Deployment, User, Version, ModelUploadType, DateString } from '../../types/interfaces'
import DisabledElementTooltip from '../../src/common/DisabledElementTooltip'
import ConfirmationDialogue from '../../src/common/ConfirmationDialogue'
import useNotification from '../../src/common/Snackbar'

const ComplianceFlow = dynamic(() => import('../../src/ComplianceFlow'))

type TabOptions = 'overview' | 'compliance' | 'build' | 'deployments' | 'settings'

function isTabOption(value: string): value is TabOptions {
  return ['overview', 'compliance', 'build', 'deployments', 'settings'].includes(value)
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => (
  <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
))

function Model() {
  const router = useRouter()
  const theme = useTheme()
  const { uuid, tab, version: versionParameter }: { uuid?: string; tab?: TabOptions; version?: string } = router.query

  const deploymentVersionsDisplayLimit = 5

  const [group, setGroup] = useState<TabOptions>('overview')
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined)
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const [modelFavourited, setModelFavourited] = useState<boolean>(false)
  const [favouriteButtonDisabled, setFavouriteButtonDisabled] = useState<boolean>(false)
  const open = Boolean(anchorEl)
  const [complianceFlow, setComplianceFlow] = useState<Elements>([])
  const [showLastViewedWarning, setShowLastViewedWarning] = useState(false)
  const [managerLastViewed, setManagerLastViewed] = useState<DateString | undefined>()
  const [reviewerLastViewed, setReviewerLastViewed] = useState<DateString | undefined>()
  const [isManager, setIsManager] = useState(false)
  const [isReviewer, setIsReviewer] = useState(false)

  const { currentUser, isCurrentUserLoading, mutateCurrentUser, isCurrentUserError } = useGetCurrentUser()
  const { versions, isVersionsLoading, isVersionsError } = useGetModelVersions(uuid)
  const { version, isVersionLoading, isVersionError, mutateVersion } = useGetModelVersion(uuid, selectedVersion, true)
  const { deployments, isDeploymentsLoading, isDeploymentsError } = useGetModelDeployments(uuid)
  const { versionAccess } = useGetVersionAccess(version?._id)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteModelErrorMessage, setDeleteModelErrorMessage] = useState('')

  const hasUploadType = useMemo(() => version !== undefined && !!version.metadata.buildOptions?.uploadType, [version])
  const sendNotification = useNotification()

  // isPotentialUploader stores whether an uploader could plausibly have access to privileged functions.
  // It defaults to true, until it hears false from the network access check.
  const isPotentialUploader = useMemo(() => versionAccess?.uploader !== false, [versionAccess])

  const addQueryParameter = (key: string, value: string) => {
    const routerParameters = router.query
    routerParameters[key] = value
    let path = `/model/${uuid}?`
    Object.keys(routerParameters).forEach((routerParameter: string) => {
      if (routerParameter !== 'uuid') {
        path += `${routerParameter}=${routerParameters[routerParameter]}&`
      }
    })
    path = path.substring(0, path.length - 1)
    router.push(path)
  }

  const onVersionChange = (event: SelectChangeEvent<string>) => {
    setSelectedVersion(event.target.value)
    addQueryParameter('version', event.target.value)
  }

  const handleGroupChange = (_event: React.SyntheticEvent, newValue: TabOptions) => {
    setGroup(newValue)
    mutateVersion()
    addQueryParameter('tab', newValue)
  }

  const requestDeployment = () => {
    if (version) router.push(`/model/${uuid}/deploy`)
  }

  const copyModelCardToClipboard = () => {
    copy(JSON.stringify(version?.metadata, null, 2))
    sendNotification({ variant: 'success', msg: 'Copied model card to clipboard' })
  }

  useEffect(() => {
    if (versionAccess) {
      setIsManager(versionAccess.manager)
      setIsReviewer(versionAccess.reviewer)
    }
  }, [versionAccess])

  const updateLastViewed = useCallback(
    (role: string) => {
      if (isManager && version?.updatedAt) {
        const versionLastUpdatedAt = new Date(version?.updatedAt)
        if (
          ((managerLastViewed && new Date(managerLastViewed).getTime() < versionLastUpdatedAt.getTime()) ||
            (reviewerLastViewed && new Date(reviewerLastViewed).getTime() < versionLastUpdatedAt.getTime())) &&
          !isPotentialUploader
        ) {
          setShowLastViewedWarning(true)
        }
        putEndpoint(`/api/v1/version/${version?._id}/lastViewed/${role}`)
      }
    },
    [managerLastViewed, reviewerLastViewed, version?._id, version?.updatedAt, isManager, isPotentialUploader]
  )

  useEffect(() => {
    if (currentUser) {
      if (isManager) {
        updateLastViewed('manager')
      }
      if (isReviewer) {
        updateLastViewed('reviewer')
      }
    }
  }, [currentUser, updateLastViewed, isManager, isReviewer])

  useEffect(() => {
    if (version && managerLastViewed === undefined) {
      setManagerLastViewed(version.managerLastViewed)
    }
    if (version && reviewerLastViewed === undefined) {
      setReviewerLastViewed(version.reviewerLastViewed)
    }
  }, [version, reviewerLastViewed, managerLastViewed])

  useEffect(() => {
    if (version) {
      setComplianceFlow(createComplianceFlow(version))
    }
  }, [version, setComplianceFlow])

  useEffect(() => {
    if (tab !== undefined && isTabOption(tab)) {
      setGroup(tab)
    }
  }, [tab])

  useEffect(() => {
    if (versionParameter !== undefined) {
      setSelectedVersion(versionParameter)
    }
  }, [versionParameter])

  useEffect(() => {
    if (!currentUser || !version?.model) return
    setModelFavourited(currentUser.favourites?.includes(version?.model as unknown as Types.ObjectId))
  }, [currentUser, version, setModelFavourited])

  const error = MultipleErrorWrapper(`Unable to load model page`, {
    isVersionsError,
    isVersionError,
    isDeploymentsError,
    isCurrentUserError,
  })
  if (error) return error

  const Loading = <Wrapper title='Loading...' page='model' />

  if (isVersionsLoading || !versions) return Loading
  if (isVersionLoading || !version) return Loading
  if (isDeploymentsLoading || !deployments) return Loading
  if (isCurrentUserLoading || !currentUser) return Loading

  const editModel = () => {
    router.push(`/model/${uuid}/edit/${version?.version}`)
  }

  const uploadNewVersion = () => {
    router.push(`/model/${uuid}/new-version`)
  }

  const actionMenuClicked = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget as HTMLDivElement)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const setModelFavourite = async (favourite: boolean) => {
    if (version.model !== undefined) {
      setFavouriteButtonDisabled(true)
      await postEndpoint(`/api/v1/user/${favourite ? 'favourite' : 'unfavourite'}/${version?.model}`, {})
        .then((res) => res.json())
        .then((user: User) => {
          setFavouriteButtonDisabled(false)
          mutateCurrentUser(user)
        })
    }
  }

  const requestApprovalReset = async () => {
    const response = await postEndpoint(`/api/v1/version/${version?._id}/reset-approvals`, {})

    if (response.ok) {
      sendNotification({ variant: 'success', msg: 'Approvals reset' })
      mutateVersion()
    } else {
      sendNotification({ variant: 'error', msg: await getErrorMessage(response) })
    }
  }

  const handleDelete = () => {
    setDeleteModelErrorMessage('')
    setDeleteConfirmOpen(true)
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
  }

  const handleDeleteConfirm = async () => {
    const response = await deleteEndpoint(`/api/v1/version/${version._id}`)

    if (response.ok) {
      router.push('/')
    } else {
      setDeleteModelErrorMessage(await getErrorMessage(response))
    }
  }

  return (
    <Wrapper title={`Model: ${version.metadata.highLevelDetails.name}`} page='model'>
      {hasUploadType && version.metadata.buildOptions.uploadType === ModelUploadType.ModelCard && (
        <Box sx={{ pb: 2 }}>
          <Alert severity='info' sx={{ width: 'fit-content', m: 'auto' }} data-test='modelCardPageAlert'>
            This model version was uploaded as just a model card
          </Alert>
        </Box>
      )}
      {showLastViewedWarning && (
        <Box sx={{ pb: 2 }}>
          <Alert
            onClose={() => setShowLastViewedWarning(false)}
            severity='warning'
            sx={{ width: 'fit-content', m: 'auto' }}
          >
            This model version has been updated since you last viewed it
          </Alert>
        </Box>
      )}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Grid container justifyContent='space-between' alignItems='center'>
            <Stack direction='row' spacing={2}>
              <ApprovalsChip
                approvals={[
                  { reviewers: version.metadata.contacts.manager, status: version.managerApproved },
                  { reviewers: version.metadata.contacts.reviewer, status: version.reviewerApproved },
                ]}
              />
              <Divider orientation='vertical' flexItem />
              <Button
                id='model-actions-button'
                aria-controls='model-actions-menu'
                aria-haspopup='true'
                aria-expanded={open ? 'true' : undefined}
                onClick={actionMenuClicked}
                variant='outlined'
                data-test='modelActionsButton'
                endIcon={open ? <UpArrow /> : <DownArrow />}
              >
                Actions
              </Button>
            </Stack>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuList>
                <DisabledElementTooltip
                  conditions={[
                    !version.built ? 'Version needs to build.' : '',
                    version.managerApproved !== 'Accepted' ? 'Waiting on manager approval.' : '',
                    version.reviewerApproved !== 'Accepted' ? 'Waiting on technical reviewer approval.' : '',
                  ]}
                >
                  <MenuItem
                    onClick={requestDeployment}
                    disabled={
                      !version.built ||
                      version.managerApproved !== 'Accepted' ||
                      version.reviewerApproved !== 'Accepted'
                    }
                    data-test='submitDeployment'
                  >
                    <ListItemIcon>
                      <UploadIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Request deployment</ListItemText>
                  </MenuItem>
                </DisabledElementTooltip>
                <Divider />
                {!modelFavourited && (
                  <MenuItem
                    onClick={() => setModelFavourite(true)}
                    disabled={favouriteButtonDisabled}
                    data-test='favouriteModelButton'
                  >
                    <>
                      <ListItemIcon>
                        <FavoriteBorder fontSize='small' />
                      </ListItemIcon>
                      <ListItemText>Favourite</ListItemText>
                    </>
                  </MenuItem>
                )}
                {modelFavourited && (
                  <MenuItem
                    onClick={() => setModelFavourite(false)}
                    disabled={favouriteButtonDisabled}
                    data-test='unfavouriteModelButton'
                  >
                    <>
                      <ListItemIcon>
                        <Favorite fontSize='small' />
                      </ListItemIcon>
                      <ListItemText>Unfavourite</ListItemText>
                    </>
                  </MenuItem>
                )}
                <DisabledElementTooltip
                  conditions={[
                    version.managerApproved === 'Accepted' && version.reviewerApproved === 'Accepted'
                      ? 'Version has already been approved by both a manager and a technical reviewer.'
                      : '',
                    !isPotentialUploader ? 'You do not have permission to edit this model.' : '',
                  ]}
                >
                  <MenuItem
                    onClick={editModel}
                    disabled={
                      (version.managerApproved === 'Accepted' && version.reviewerApproved === 'Accepted') ||
                      !isPotentialUploader
                    }
                    data-test='editModelButton'
                  >
                    <ListItemIcon>
                      <EditIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                  </MenuItem>
                </DisabledElementTooltip>
                <MenuItem onClick={uploadNewVersion} disabled={!isPotentialUploader} data-test='newVersionButton'>
                  <ListItemIcon>
                    <PostAddIcon fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Upload new version</ListItemText>
                </MenuItem>
                <DisabledElementTooltip
                  conditions={[
                    version.managerApproved === 'No Response' && version.reviewerApproved === 'No Response'
                      ? 'Version needs to have at least one approval before it can have its approvals reset,'
                      : '',
                  ]}
                >
                  <MenuItem
                    onClick={requestApprovalReset}
                    disabled={version.managerApproved === 'No Response' && version.reviewerApproved === 'No Response'}
                  >
                    <ListItemIcon>
                      <RestartAlt fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Reset approvals</ListItemText>
                  </MenuItem>
                </DisabledElementTooltip>
              </MenuList>
            </Menu>
            <Stack direction='row' spacing={2}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel id='version-label'>Version</InputLabel>
                <Select
                  labelId='version-label'
                  id='version'
                  value={version.version}
                  label='Version'
                  onChange={onVersionChange}
                >
                  {versions.map((versionObj: Version) => (
                    <MenuItem key={`item-${versionObj._id}`} value={versionObj.version}>
                      {versionObj.version}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Grid>

          <Tabs value={group} onChange={handleGroupChange} aria-label='basic tabs example'>
            <Tab label='Overview' value='overview' />
            <Tab label='Compliance' value='compliance' />
            <Tab
              label='Build Logs'
              value='build'
              disabled={hasUploadType && version.metadata.buildOptions.uploadType === ModelUploadType.ModelCard}
              data-test='buildLogsTab'
            />
            <Tab label='Deployments' value='deployments' />
            <Tab label='Settings' value='settings' data-test='settingsTab' />
          </Tabs>
        </Box>
        <Box sx={{ marginBottom: 3 }} />

        {group === 'overview' && (
          <>
            {version.state?.build?.state === 'failed' && (
              <Alert sx={{ mb: 3 }} severity='error'>
                Build Status: Failed
              </Alert>
            )}
            {version.state?.build?.state === 'retrying' && (
              <Alert sx={{ mb: 3 }} severity='warning'>
                Build Status: Retrying
              </Alert>
            )}
            <ModelOverview version={version} />
          </>
        )}

        {group === 'compliance' && <ComplianceFlow initialElements={complianceFlow} />}

        {group === 'build' && <TerminalLog logs={version.logs} title='Model Build Logs' />}

        {group === 'deployments' && (
          <>
            {deployments.length === 0 && <EmptyBlob text='No deployments here' />}
            {deployments.map((deployment: Deployment) => (
              <Box key={`deployment-${deployment.uuid}`}>
                <Link href={`/deployment/${deployment.uuid}`} passHref>
                  <MuiLink
                    variant='h5'
                    sx={{ fontWeight: '500', textDecoration: 'none', color: theme.palette.secondary.main }}
                  >
                    {deployment.metadata.highLevelDetails.name}
                  </MuiLink>
                </Link>

                <Box sx={{ mb: 1 }}>
                  <Stack direction='row'>
                    <Typography variant='subtitle2' sx={{ mt: 'auto', mb: 'auto', mr: 1 }}>
                      Contacts:
                    </Typography>
                    {deployment.metadata.contacts.owner.map((owner) => (
                      <Chip
                        key={owner.id}
                        color='primary'
                        avatar={<UserAvatar entity={owner} size='chip' />}
                        label={owner.id}
                      />
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Stack direction='row'>
                    <Typography variant='subtitle2' sx={{ mt: 'auto', mb: 'auto', mr: 1 }}>
                      Associated versions:
                    </Typography>
                    {deployment.versions.length > 0 &&
                      versions
                        .filter((deploymentVersion) => deployment.versions.includes(deploymentVersion._id))
                        .slice(0, deploymentVersionsDisplayLimit)
                        .map((filteredVersion) => (
                          <Chip color='primary' key={filteredVersion.version} label={filteredVersion.version} />
                        ))}
                    {deployment.versions.length > 3 && (
                      <Typography sx={{ mt: 'auto', mb: 'auto' }}>{`...plus ${
                        versions.filter((deploymentVersionForLimit) =>
                          deployment.versions.includes(deploymentVersionForLimit._id)
                        ).length - deploymentVersionsDisplayLimit
                      } more`}</Typography>
                    )}
                  </Stack>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 1 }} />
              </Box>
            ))}
          </>
        )}

        {group === 'settings' && (
          <Box data-test='modelSettingsPage'>
            <Typography variant='h6' sx={{ mb: 1 }}>
              General
            </Typography>

            <Box mb={2}>
              <Button variant='outlined' onClick={copyModelCardToClipboard}>
                Copy model card to clipboard
              </Button>
            </Box>

            <Box sx={{ mb: 4 }} />
            <ConfirmationDialogue
              open={deleteConfirmOpen}
              title='Delete version'
              onConfirm={handleDeleteConfirm}
              onCancel={handleDeleteCancel}
              errorMessage={deleteModelErrorMessage}
            />
            <Typography variant='h6' sx={{ mb: 1 }}>
              Danger Zone
            </Typography>
            <Stack direction='row' spacing={2}>
              <DisabledElementTooltip
                conditions={[!isPotentialUploader ? 'You do not have permission to delete this version.' : '']}
                placement='bottom'
              >
                <Button
                  variant='contained'
                  disabled={!isPotentialUploader}
                  color='error'
                  onClick={handleDelete}
                  data-test='deleteVersionButton'
                >
                  Delete version
                </Button>
              </DisabledElementTooltip>
              <Button variant='contained' color='error' disabled data-test='deleteModelButton'>
                Delete model
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Wrapper>
  )
}

export default Model
