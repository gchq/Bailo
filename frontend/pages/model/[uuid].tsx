import EditIcon from '@mui/icons-material/EditTwoTone'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/FavoriteTwoTone'
import DownArrow from '@mui/icons-material/KeyboardArrowDownTwoTone'
import UpArrow from '@mui/icons-material/KeyboardArrowUpTwoTone'
import PostAddIcon from '@mui/icons-material/PostAddTwoTone'
import UploadIcon from '@mui/icons-material/UploadTwoTone'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { postEndpoint, putEndpoint } from 'data/api'
import { useGetModelVersion, useGetModelVersions } from 'data/model'
import { useGetCurrentUser } from 'data/user'
import { useGetVersionAccess } from 'data/version'
import { Types } from 'mongoose'
import { useRouter } from 'next/router'
import React, { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Build from 'src/model/Build'
import CodeExplorer from 'src/model/CodeExplorer'
import Compliance from 'src/model/Compliance'
import Deployments from 'src/model/Deployments'
import Overview from 'src/model/Overview'
import Settings from 'src/model/Settings'

import ApprovalsChip from '../../src/common/ApprovalsChip'
import DisabledElementTooltip from '../../src/common/DisabledElementTooltip'
import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import Wrapper from '../../src/Wrapper'
import { DateString, ModelUploadType, User, Version } from '../../types/types'

type TabOptions = 'overview' | 'compliance' | 'build' | 'deployments' | 'code' | 'settings'

function isTabOption(value: string): value is TabOptions {
  return ['overview', 'compliance', 'build', 'deployments', 'code', 'settings'].includes(value)
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

Alert.displayName = 'Alert'

function Model() {
  const router = useRouter()
  const theme = useTheme()
  const { uuid, tab, version: versionParameter }: { uuid?: string; tab?: TabOptions; version?: string } = router.query

  const [group, setGroup] = useState<TabOptions>('overview')
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined)
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const [modelFavourited, setModelFavourited] = useState<boolean>(false)
  const [favouriteButtonDisabled, setFavouriteButtonDisabled] = useState<boolean>(false)
  const open = Boolean(anchorEl)
  const [showLastViewedWarning, setShowLastViewedWarning] = useState(false)
  const [managerLastViewed, setManagerLastViewed] = useState<DateString | undefined>()
  const [reviewerLastViewed, setReviewerLastViewed] = useState<DateString | undefined>()
  const [isManager, setIsManager] = useState(false)
  const [isReviewer, setIsReviewer] = useState(false)

  const [ungovernedDialogOpen, setUngovernedDialogOpen] = useState(false)
  const [ungovernedDeploymentName, setUngovernedDeploymentName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const { currentUser, isCurrentUserLoading, mutateCurrentUser, isCurrentUserError } = useGetCurrentUser()
  const { versions, isVersionsLoading, isVersionsError } = useGetModelVersions(uuid)
  const { version, isVersionLoading, isVersionError, mutateVersion } = useGetModelVersion(uuid, selectedVersion, false)
  const { versionAccess } = useGetVersionAccess(version?._id)

  const hasUploadType = useMemo(() => version !== undefined && !!version.metadata.buildOptions?.uploadType, [version])

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
    isCurrentUserError,
  })
  if (error) return error

  const Loading = <Wrapper title='Loading...' page='model' />

  if (isVersionsLoading || !versions) return Loading
  if (isVersionLoading || !version) return Loading
  if (isCurrentUserLoading || !currentUser) return Loading

  const uploadNewVersion = () => {
    router.push(`/model/${uuid}/new-version`)
  }

  const actionMenuClicked = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget as HTMLDivElement)
  }

  const handleMenuClose = () => {
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

  const handleUngovernedDialogClose = () => {
    setUngovernedDialogOpen(false)
  }

  const requestUngovernedDeployment = async () => {
    setErrorMessage('')
    const response = await postEndpoint(`/api/v1/deployment/ungoverned`, {
      name: ungovernedDeploymentName,
      modelUuid: uuid,
      initialVersionRequested: version.version,
    })
    if (response.status >= 400) {
      let responseError = response.statusText
      try {
        responseError = `${response.statusText}: ${(await response.json()).error.message}`
      } catch (e) {
        setErrorMessage('No response from server')
        return
      }

      setErrorMessage(responseError)
      return
    }

    const { uuid: responseUuid } = await response.json()
    router.push(`/deployment/${responseUuid}`)
  }

  return (
    <Wrapper title={`Model: ${version.metadata.highLevelDetails.name}`} page='model'>
      {hasUploadType && version.metadata?.buildOptions?.uploadType === ModelUploadType.ModelCard && (
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
            <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
              <MenuList>
                <DisabledElementTooltip
                  conditions={[
                    !version.built ? 'Waiting on Version build' : '',
                    version.managerApproved !== 'Accepted' ? 'Waiting on manager approval' : '',
                    version.reviewerApproved !== 'Accepted' ? 'Waiting on technical reviewer approval' : '',
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
                <DisabledElementTooltip conditions={[!version.built ? 'Waiting on Version build' : '']}>
                  <MenuItem
                    onClick={() => setUngovernedDialogOpen(true)}
                    disabled={!version.built}
                    data-test='submitUngovernedDeployment'
                  >
                    <ListItemIcon>
                      <UploadIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Request ungoverned deployment</ListItemText>
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
                  conditions={[!isPotentialUploader ? 'You do not have permission to edit this model' : '']}
                >
                  <MenuItem
                    onClick={() => router.push(`/model/${uuid}/edit/${version?.version}`)}
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
              disabled={hasUploadType && version.metadata?.buildOptions?.uploadType === ModelUploadType.ModelCard}
              data-test='buildLogsTab'
            />
            <Tab label='Deployments' value='deployments' />
            <Tab
              label='Explore Code'
              value='code'
              disabled={hasUploadType && version.metadata?.buildOptions?.uploadType !== ModelUploadType.Zip}
            />
            <Tab label='Settings' value='settings' data-test='settingsTab' />
          </Tabs>
        </Box>
        <Box sx={{ marginBottom: 3 }} />

        {group === 'overview' && <Overview version={version} />}

        {group === 'compliance' && <Compliance version={version} />}

        {group === 'build' && <Build version={version} />}

        {group === 'deployments' && <Deployments version={version} />}

        {group === 'code' && <CodeExplorer id={version._id} addQueryParameter={addQueryParameter} />}

        {group === 'settings' && <Settings version={version} isPotentialUploader={isPotentialUploader} />}
      </Paper>
      <Dialog open={ungovernedDialogOpen} onClose={handleUngovernedDialogClose}>
        <DialogContent>
          <Stack spacing={1}>
            <Stack direction='row' spacing={2}>
              <TextField
                label='Deployment name'
                variant='outlined'
                value={ungovernedDeploymentName}
                onChange={(event) => setUngovernedDeploymentName(event.target.value)}
              />
              <Button
                disabled={ungovernedDeploymentName === ''}
                variant='contained'
                onClick={requestUngovernedDeployment}
                autoFocus
              >
                Request
              </Button>
            </Stack>
            <Typography sx={{ color: theme.palette.error.main }} variant='caption'>
              {errorMessage}
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </Wrapper>
  )
}

export default Model
