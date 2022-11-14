import Info from '@mui/icons-material/Info'
import DownArrow from '@mui/icons-material/KeyboardArrowDownTwoTone'
import UpArrow from '@mui/icons-material/KeyboardArrowUpTwoTone'
import RestartAlt from '@mui/icons-material/RestartAltTwoTone'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import MuiLink from '@mui/material/Link'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import copy from 'copy-to-clipboard'
import { useRouter } from 'next/router'
import React, { MouseEvent, useEffect, useMemo, useState } from 'react'
import { Elements } from 'react-flow-renderer'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { ModelDoc } from '../../server/models/Model'
import { useGetDeployment } from '../../data/deployment'
import { useGetUiConfig } from '../../data/uiConfig'
import { useGetCurrentUser } from '../../data/user'
import ApprovalsChip from '../../src/common/ApprovalsChip'
import DeploymentOverview from '../../src/DeploymentOverview'
import MultipleErrorWrapper from '../../src/errors/MultipleErrorWrapper'
import TerminalLog from '../../src/TerminalLog'
import Wrapper from '../../src/Wrapper'
import { createDeploymentComplianceFlow } from '../../utils/complianceFlow'
import { postEndpoint } from '../../data/api'
import RawModelExportList from '../../src/RawModelExportList'
import DisabledElementTooltip from '../../src/common/DisabledElementTooltip'
import { ModelUploadType } from '../../types/interfaces'
import { VersionDoc } from '../../server/models/Version'
import { getErrorMessage } from '../../utils/fetcher'
import useNotification from '../../src/common/Snackbar'

const ComplianceFlow = dynamic(() => import('../../src/ComplianceFlow'))

type TabOptions = 'overview' | 'compliance' | 'build' | 'settings' | 'exports'

function isTabOption(value: string): value is TabOptions {
  return ['overview', 'compliance', 'build', 'exports', 'settings'].includes(value)
}

function CodeLine({ line }) {
  const theme = useTheme()
  const sendNotification = useNotification()

  const handleButtonClick = () => {
    navigator.clipboard.writeText(line)
    sendNotification({ variant: 'success', msg: 'Copied to clipboard' })
  }

  return (
    <div
      style={{
        cursor: 'pointer',
      }}
      role='button'
      tabIndex={0}
      onClick={() => {
        handleButtonClick()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleButtonClick()
        }
      }}
    >
      <Tooltip title='Copy to clipboard' arrow>
        <Box sx={{ backgroundColor: theme.palette.container.main, p: 1, borderRadius: 2 }}>
          $ <b>{line}</b>
        </Box>
      </Tooltip>
    </div>
  )
}

export default function Deployment() {
  const router = useRouter()
  const { uuid, tab }: { uuid?: string; tab?: TabOptions } = router.query

  const [group, setGroup] = useState<TabOptions>('overview')
  const [complianceFlow, setComplianceFlow] = useState<Elements>([])
  const [open, setOpen] = useState<boolean>(false)
  const [tag, setTag] = useState<string>('')
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const actionOpen = anchorEl !== null

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { deployment, isDeploymentLoading, isDeploymentError, mutateDeployment } = useGetDeployment(uuid, true)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const theme = useTheme()
  const sendNotification = useNotification()

  const initialVersionRequested: Partial<VersionDoc> | undefined = useMemo(() => {
    if (!deployment) return undefined
    const initialVersion = deployment.versions.find(
      (version: Partial<VersionDoc>) => version.version === deployment.metadata.highLevelDetails.initialVersionRequested
    )
    return initialVersion
  }, [deployment])

  const hasUploadType = useMemo(
    () => initialVersionRequested !== undefined && !!initialVersionRequested.metadata.buildOptions?.uploadType,
    [initialVersionRequested]
  )

  useEffect(() => {
    if (deployment?.metadata?.highLevelDetails !== undefined) {
      const { modelID, initialVersionRequested: versionRequested } = deployment.metadata.highLevelDetails
      setTag(`${modelID}:${versionRequested}`)
    }
  }, [deployment])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabOptions) => {
    setGroup(newValue)
    router.push(`/deployment/${uuid}?tab=${newValue}`)
  }

  useEffect(() => {
    if (tab !== undefined && isTabOption(tab)) {
      setGroup(tab)
    }
  }, [tab])

  useEffect(() => {
    if (deployment) {
      setComplianceFlow(createDeploymentComplianceFlow(deployment))
    }
  }, [deployment])

  const handleClickOpen = () => {
    if (!isDeploymentLoading && deployment !== undefined) {
      setOpen(true)
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const actionMenuClicked = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget as HTMLDivElement)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const copyDeploymentCardToClipboard = () => {
    copy(JSON.stringify(deployment?.metadata, null, 2))
    sendNotification({ variant: 'success', msg: 'Copied deployment metadata to clipboard' })
  }

  const error = MultipleErrorWrapper(`Unable to load deployment page`, {
    isDeploymentError,
    isUiConfigError,
    isCurrentUserError,
  })
  if (error) return error

  const Loading = <Wrapper title='Loading...' page='deployment' />

  if (isDeploymentLoading || !deployment) return Loading
  if (isUiConfigLoading || !uiConfig) return Loading
  if (isCurrentUserLoading || !currentUser) return Loading

  const deploymentTag = `${uiConfig?.registry.host}/${deployment.metadata.contacts.requester}/${tag}`

  const requestApprovalReset = async () => {
    const response = await postEndpoint(`/api/v1/deployment/${deployment?.uuid}/reset-approvals`, {})

    if (response.ok) {
      sendNotification({ variant: 'success', msg: 'Approvals reset' })
      mutateDeployment()
    } else {
      sendNotification({ variant: 'error', msg: await getErrorMessage(response) })
    }
  }

  return (
    <>
      <Wrapper title={`Deployment: ${deployment.metadata.highLevelDetails.name}`} page='deployment'>
        {deployment && (
          <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ pb: 3 }}>
            <Button
              variant='text'
              color='primary'
              startIcon={<ArrowBackIosNewIcon />}
              onClick={() => router.push(`/model/${(deployment.model as ModelDoc).uuid}`)}
            >
              Back to model
            </Button>
            {hasUploadType && initialVersionRequested?.metadata.buildOptions.uploadType === ModelUploadType.ModelCard && (
              <Box>
                <Alert
                  severity='info'
                  sx={{
                    width: 'fit-content',
                    m: 'auto',
                    backgroundColor: '#0288d1',
                    color: '#fff',
                    '& .MuiAlert-icon': {
                      color: '#fff',
                    },
                  }}
                >
                  This model version was uploaded as just a model card
                </Alert>
              </Box>
            )}
            {hasUploadType && initialVersionRequested?.metadata.buildOptions.uploadType === ModelUploadType.Docker && (
              <Box>
                <Alert
                  severity='info'
                  sx={{
                    width: 'fit-content',
                    m: 'auto',
                    backgroundColor: '#0288d1',
                    color: '#fff',
                    '& .MuiAlert-icon': {
                      color: '#fff',
                    },
                  }}
                >
                  This model was not built by Bailo and may not follow the standard format.
                </Alert>
              </Box>
            )}
            <Box>
              <Button
                variant='outlined'
                color='primary'
                disabled={
                  !hasUploadType ||
                  initialVersionRequested?.metadata?.buildOptions.uploadType === ModelUploadType.ModelCard
                }
                startIcon={<Info />}
                onClick={handleClickOpen}
              >
                Show download commands
              </Button>
            </Box>
          </Stack>
        )}
        <Paper sx={{ p: 3 }}>
          <Stack direction='row' spacing={2}>
            <ApprovalsChip
              approvals={[{ reviewer: deployment.metadata.contacts.manager, status: deployment.managerApproved }]}
            />
            <Divider orientation='vertical' flexItem />
            <Button
              id='model-actions-button'
              aria-controls='model-actions-menu'
              aria-haspopup='true'
              aria-expanded={actionOpen ? 'true' : undefined}
              onClick={actionMenuClicked}
              variant='outlined'
              data-test='requestDeploymentButton'
              endIcon={actionOpen ? <UpArrow /> : <DownArrow />}
            >
              Actions
            </Button>
          </Stack>
          <Menu anchorEl={anchorEl as HTMLDivElement} open={actionOpen} onClose={handleMenuClose}>
            <MenuList>
              <DisabledElementTooltip
                conditions={[
                  deployment?.managerApproved === 'No Response'
                    ? 'Deployment needs to be approved before it can have its approvals reset.'
                    : '',
                ]}
              >
                <MenuItem onClick={requestApprovalReset} disabled={deployment?.managerApproved === 'No Response'}>
                  <ListItemIcon>
                    <RestartAlt fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Reset approvals</ListItemText>
                </MenuItem>
              </DisabledElementTooltip>
            </MenuList>
          </Menu>
          <Box sx={{ borderBottom: 1, marginTop: 1, borderColor: 'divider' }}>
            <Tabs value={group} onChange={handleTabChange} aria-label='basic tabs example'>
              <Tab label='Overview' value='overview' />
              <Tab label='Compliance' value='compliance' />
              <Tab
                label='Build Logs'
                value='build'
                disabled={
                  hasUploadType &&
                  initialVersionRequested?.metadata.buildOptions.uploadType === ModelUploadType.ModelCard
                }
              />
              <Tab label='Settings' value='settings' />
              <Tab
                style={{ pointerEvents: 'auto' }}
                disabled={
                  deployment.managerApproved !== 'Accepted' ||
                  (hasUploadType && ModelUploadType.Zip !== initialVersionRequested?.metadata.buildOptions.uploadType)
                }
                value='exports'
                label={
                  <DisabledElementTooltip
                    conditions={[
                      deployment.managerApproved !== 'Accepted'
                        ? 'Deployment needs to be approved before you can view the exported model list.'
                        : '',
                      hasUploadType && ModelUploadType.Zip !== initialVersionRequested?.metadata.buildOptions.uploadType
                        ? 'Model does not have raw artifacts attached'
                        : '',
                    ]}
                    placement='top'
                  >
                    Model Exports
                  </DisabledElementTooltip>
                }
                data-test='modelExportsTab'
              />
            </Tabs>
          </Box>
          <Box sx={{ marginBottom: 3 }} />

          {group === 'overview' && <DeploymentOverview deployment={deployment} />}

          {group === 'compliance' && <ComplianceFlow initialElements={complianceFlow} />}

          {group === 'build' && <TerminalLog logs={deployment.logs} title='Deployment Build Logs' />}

          {group === 'settings' && (
            <>
              <Typography variant='h6' sx={{ mb: 1 }}>
                General
              </Typography>
              <Box mb={2}>
                <Button variant='outlined' onClick={copyDeploymentCardToClipboard}>
                  Copy deployment metadata to clipboard
                </Button>
              </Box>
            </>
          )}

          {group === 'exports' && deployment.managerApproved === 'Accepted' && (
            <RawModelExportList deployment={deployment} />
          )}
        </Paper>
      </Wrapper>
      <Dialog maxWidth='lg' onClose={handleClose} open={open}>
        <DialogTitle sx={{ backgroundColor: theme.palette.container.main }}>Pull from Docker</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ p: 2 }}>
            <Box>
              <p style={{ margin: 0 }}>
                # Login to Docker (your token can be found on the
                <Link href='/settings' passHref>
                  <MuiLink sx={{ ml: 0.5, mr: 0.5, color: theme.palette.secondary.main }}>settings</MuiLink>
                </Link>
                page) {theme.palette.mode}
              </p>
              <CodeLine line={`docker login ${uiConfig.registry.host} -u ${deployment.metadata.contacts.requester}`} />
              <br />

              <p style={{ margin: 0 }}># Pull model</p>
              <CodeLine line={`docker pull ${deploymentTag}`} />
              <br />

              <p style={{ margin: 0 }}># Run Docker image</p>
              <CodeLine line={`docker run -p 9999:9000 ${deploymentTag}`} />
              <p style={{ margin: 0 }}># (the container exposes on port 9000, available on the host as port 9999)</p>
              <br />

              <p style={{ margin: 0 }}># Check that the Docker container is running</p>
              <CodeLine line='docker ps' />
              <br />

              <p style={{ margin: 0 }}># The model is accessible at localhost:9999</p>
            </Box>
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  )
}
