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
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import useTheme from '@mui/styles/useTheme'
import copy from 'copy-to-clipboard'
import { postEndpoint } from 'data/api'
import { useGetModelDeployments, useGetModelVersion, useGetModelVersions } from 'data/model'
import { useGetCurrentUser } from 'data/user'
import { setTargetValue } from 'data/utils'
import { Types } from 'mongoose'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { MouseEvent, useEffect, useState } from 'react'
import { Elements } from 'react-flow-renderer'
import UserAvatar from 'src/common/UserAvatar'
import ModelOverview from 'src/ModelOverview'
import TerminalLog from 'src/TerminalLog'
import Wrapper from 'src/Wrapper'
import createComplianceFlow from 'utils/complianceFlow'
import ApprovalsChip from '../../src/common/ApprovalsChip'
import EmptyBlob from '../../src/common/EmptyBlob'
import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import { lightTheme } from '../../src/theme'
import { Deployment, User, Version } from '../../types/interfaces'

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
  const { uuid, tab }: { uuid?: string; tab?: TabOptions } = router.query

  const deploymentVersionsDisplayLimit = 5

  const [group, setGroup] = useState<TabOptions>('overview')
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined)
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const [modelFavourited, setModelFavourited] = useState<boolean>(false)
  const [favouriteButtonDisabled, setFavouriteButtonDisabled] = useState<boolean>(false)
  const open = Boolean(anchorEl)
  const [copyModelCardSnackbarOpen, setCopyModelCardSnackbarOpen] = useState(false)
  const [complianceFlow, setComplianceFlow] = useState<Elements>([])

  const { currentUser, isCurrentUserLoading, mutateCurrentUser, isCurrentUserError } = useGetCurrentUser()
  const { versions, isVersionsLoading, isVersionsError } = useGetModelVersions(uuid)
  const { version, isVersionLoading, isVersionError, mutateVersion } = useGetModelVersion(uuid, selectedVersion)
  const { deployments, isDeploymentsLoading, isDeploymentsError } = useGetModelDeployments(uuid)

  const onVersionChange = setTargetValue(setSelectedVersion)
  const theme: any = useTheme() || lightTheme

  const handleGroupChange = (_event: React.SyntheticEvent, newValue: TabOptions) => {
    setGroup(newValue)
    mutateVersion()
    router.push(`/model/${uuid}?tab=${newValue}`)
  }

  const requestDeployment = () => {
    router.push(`/model/${uuid}/deploy`)
  }

  const copyModelCardToClipboard = () => {
    copy(JSON.stringify(version?.metadata, null, 2))
    setCopyModelCardSnackbarOpen(true)
  }

  const handleCopyModelCardSnackbarClose = () => {
    setCopyModelCardSnackbarOpen(false)
  }

  useEffect(() => {
    if (tab !== undefined && isTabOption(tab)) {
      setGroup(tab)
    }
  }, [tab])

  useEffect(() => {
    if (version) {
      setComplianceFlow(createComplianceFlow(version))
    }
  }, [version, setComplianceFlow])

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
    await postEndpoint(`/api/v1/version/${version?._id}/reset-approvals`, {}).then((res) => res.json())
  }

  return (
    <Wrapper title={`Model: ${version.metadata.highLevelDetails.name}`} page='model'>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Grid container justifyContent='space-between' alignItems='center'>
            <Stack direction='row' spacing={2}>
              <ApprovalsChip approvals={[version?.managerApproved, version?.reviewerApproved]} />
              <Divider orientation='vertical' flexItem />
              <Button
                id='model-actions-button'
                aria-controls='model-actions-menu'
                aria-haspopup='true'
                aria-expanded={open ? 'true' : undefined}
                onClick={actionMenuClicked}
                variant='outlined'
                data-test='requestDeploymentButton'
                endIcon={open ? <UpArrow /> : <DownArrow />}
              >
                Actions
              </Button>
            </Stack>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuList>
                <MenuItem
                  onClick={requestDeployment}
                  disabled={
                    !version.built || version.managerApproved !== 'Accepted' || version.reviewerApproved !== 'Accepted'
                  }
                  data-test='submitDeployment'
                >
                  <ListItemIcon>
                    <UploadIcon fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Request deployment</ListItemText>
                </MenuItem>
                <Divider />
                {!modelFavourited && (
                  <MenuItem onClick={() => setModelFavourite(true)} disabled={favouriteButtonDisabled}>
                    <>
                      <ListItemIcon>
                        <FavoriteBorder fontSize='small' />
                      </ListItemIcon>
                      <ListItemText>Favourite</ListItemText>
                    </>
                  </MenuItem>
                )}
                {modelFavourited && (
                  <MenuItem onClick={() => setModelFavourite(false)} disabled={favouriteButtonDisabled}>
                    <>
                      <ListItemIcon>
                        <Favorite fontSize='small' />
                      </ListItemIcon>
                      <ListItemText>Unfavourite</ListItemText>
                    </>
                  </MenuItem>
                )}
                <MenuItem
                  onClick={editModel}
                  disabled={
                    (version.managerApproved === 'Accepted' && version.reviewerApproved === 'Accepted') ||
                    currentUser.id !== version?.metadata?.contacts?.uploader
                  }
                >
                  <ListItemIcon>
                    <EditIcon fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={uploadNewVersion} disabled={currentUser.id !== version.metadata?.contacts?.uploader}>
                  <ListItemIcon>
                    <PostAddIcon fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Upload new version</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={requestApprovalReset}
                  disabled={version.managerApproved === 'No Response' && version.reviewerApproved === 'No Response'}
                >
                  <ListItemIcon>
                    <RestartAlt fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Reset approvals</ListItemText>
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

          <Tabs
            indicatorColor='secondary'
            textColor={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
            value={group}
            onChange={handleGroupChange}
            aria-label='basic tabs example'
          >
            <Tab label='Overview' value='overview' />
            <Tab label='Compliance' value='compliance' />
            <Tab label='Build Logs' value='build' />
            <Tab label='Deployments' value='deployments' />
            <Tab label='Settings' value='settings' />
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
                    <Chip
                      color={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
                      sx={{ backgroundColor: theme.palette.mode === 'light' ? 'primary' : 'secondary' }}
                      avatar={<UserAvatar username={deployment.metadata.contacts.requester} size='chip' />}
                      label={deployment.metadata.contacts.requester}
                    />
                    <Chip
                      color={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
                      sx={{ backgroundColor: theme.palette.mode === 'light' ? 'primary' : 'secondary' }}
                      avatar={<UserAvatar username={deployment.metadata.contacts.secondPOC} size='chip' />}
                      label={deployment.metadata.contacts.secondPOC}
                    />
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
                          <Chip
                            color={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
                            sx={{ backgroundColor: theme.palette.mode === 'light' ? 'primary' : 'secondary' }}
                            key={filteredVersion.version}
                            label={filteredVersion.version}
                          />
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
          <>
            <Typography variant='h6' sx={{ mb: 1 }}>
              General
            </Typography>

            <Box mb={2}>
              <Button variant='outlined' onClick={copyModelCardToClipboard}>
                Copy Model Card to Clipboard
              </Button>
              <Snackbar
                open={copyModelCardSnackbarOpen}
                autoHideDuration={6000}
                onClose={handleCopyModelCardSnackbarClose}
              >
                <Alert onClose={handleCopyModelCardSnackbarClose} severity='success' sx={{ width: '100%' }}>
                  Copied model card to clipboard
                </Alert>
              </Snackbar>
            </Box>

            <Box sx={{ mb: 4 }} />

            <Typography variant='h6' sx={{ mb: 1 }}>
              Danger Zone
            </Typography>
            <Button variant='contained' color='error'>
              Delete Model
            </Button>
          </>
        )}
      </Paper>
    </Wrapper>
  )
}

export default Model
