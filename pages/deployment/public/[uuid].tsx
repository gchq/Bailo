import Link from 'next/link'

import Info from '@mui/icons-material/Info'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/system/Box'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import MuiLink from '@mui/material/Link'
import useTheme from '@mui/styles/useTheme'
import Typography from '@mui/material/Typography'

import { useGetPublicDeployment } from '../../../data/deployment'
import { useGetUiConfig } from '../../../data/uiConfig'
import { useGetCurrentUser } from '../../../data/user'
import CopiedSnackbar from '../../../src/common/CopiedSnackbar'
import MultipleErrorWrapper from '../../../src/errors/MultipleErrorWrapper'
import TerminalLog from '../../../src/TerminalLog'
import Wrapper from '../../../src/Wrapper'
import { lightTheme } from '../../../src/theme'
import { VersionNameFromKey, ModelNameFromKey, UsernameFromKey } from '../../../src/util/ObjectKeyDisplay'

type TabOptions = 'overview' | 'build'

function isTabOption(value: string): value is TabOptions {
  return ['overview', 'build'].includes(value)
}

function CodeLine({ line }) {
  const [openSnackbar, setOpenSnackbar] = useState(false)

  const handleButtonClick = () => {
    navigator.clipboard.writeText(line)
    setOpenSnackbar(true)
  }

  return (
    <>
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
          <Box sx={{ backgroundColor: 'whitesmoke', color: '#383838', p: 1, borderRadius: 2 }}>
            $ <b>{line}</b>
          </Box>
        </Tooltip>
      </div>
      <CopiedSnackbar {...{ openSnackbar, setOpenSnackbar }} />
    </>
  )
}

export default function PublicDeployment() {
  const router = useRouter()
  const { uuid, tab }: { uuid?: string; tab?: TabOptions } = router.query

  const [group, setGroup] = useState<TabOptions>('overview')
  const [open, setOpen] = useState<boolean>(false)
  const [tag, setTag] = useState<string>('')

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { publicDeployment, isPublicDeploymentLoading, isPublicDeploymentError } = useGetPublicDeployment(uuid)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const theme: any = useTheme() || lightTheme

  useEffect(() => {
    if (publicDeployment !== undefined) {
      const { model, version } = publicDeployment
      setTag(`${model}:${version}`)
    }
  }, [publicDeployment])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabOptions) => {
    setGroup(newValue)
    router.push(`/deployment/public/${uuid}?tab=${newValue}`)
  }

  useEffect(() => {
    if (tab !== undefined && isTabOption(tab)) {
      setGroup(tab)
    }
  }, [tab])

  const handleClickOpen = () => {
    if (!isPublicDeploymentLoading && publicDeployment !== undefined) {
      setOpen(true)
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const error = MultipleErrorWrapper(`Unable to load public deployment page`, {
    isPublicDeploymentError,
    isUiConfigError,
    isCurrentUserError,
  })
  if (error) return error

  const Loading = <Wrapper title='Loading...' page='deployment' />

  if (isPublicDeploymentLoading || !publicDeployment) return Loading
  if (isUiConfigLoading || !uiConfig) return Loading
  if (isCurrentUserLoading || !currentUser) return Loading

  const deploymentTag = `${uiConfig?.registry.host}/${currentUser.id}/${tag}`

  return (
    <>
      <Wrapper title={`Deployment: ${publicDeployment.uuid}`} page='deployments'>
        <Box sx={{ textAlign: 'right', pb: 3 }}>
          <Button variant='outlined' color='primary' startIcon={<Info />} onClick={handleClickOpen}>
            Show download commands
          </Button>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ borderBottom: 1, marginTop: 1, borderColor: 'divider' }}>
            <Tabs
              textColor={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
              indicatorColor='secondary'
              value={group}
              onChange={handleTabChange}
              aria-label='basic tabs example'
            >
              <Tab label='Overview' value='overview' />
              <Tab label='Build Logs' value='build' />
            </Tabs>
          </Box>
          <Box sx={{ marginBottom: 3 }} />

          {group === 'overview' && (
            <Box sx={{ backgroundColor: theme.palette.primary.main, color: 'white', borderRadius: 2 }}>
              <Box sx={{ p: 2 }}>
                <Typography variant='h6'>Deployment name</Typography>
                <Typography variant='body1'>{publicDeployment.uuid}</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography variant='h6'>Model</Typography>
                <ModelNameFromKey modelId={publicDeployment.model.toString()} fontVariant='body1' />
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography variant='h6'>Version</Typography>
                <VersionNameFromKey versionId={publicDeployment.version.toString()} fontVariant='body1' />
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography variant='h6'>Owner</Typography>
                <UsernameFromKey userId={publicDeployment.owner.toString()} fontVariant='body1' />
              </Box>
            </Box>
          )}

          {group === 'build' && <TerminalLog logs={publicDeployment.logs} title='Deployment Build Logs' />}
        </Paper>
      </Wrapper>
      <Dialog maxWidth='lg' onClose={handleClose} open={open}>
        <DialogTitle sx={{ backgroundColor: theme.palette.mode === 'light' ? '#f3f1f1' : '#5a5a5a' }}>
          Pull from Docker
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ p: 2 }}>
            <Box>
              <p style={{ margin: 0 }}>
                # Login to Docker (your token can be found on the
                <Link href='/settings'>
                  <MuiLink sx={{ ml: 0.5, mr: 0.5, color: theme.palette.secondary.main }}>settings</MuiLink>
                </Link>
                page) {theme.palette.mode}
              </p>
              <CodeLine line={`docker login ${uiConfig.registry.host} -u ${currentUser.id}`} />
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
