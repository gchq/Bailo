import { Box, Container, Dialog, DialogTitle, Divider, List, ListItem, ListItemButton, Stack } from '@mui/material'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React from 'react'
import { useEffect, useState } from 'react'
import DockerLogin from 'src/settings/authentication/DockerLogin'
import KubernetesToken from 'src/settings/authentication/KubernetesToken'
import PersonalAccessToken from 'src/settings/authentication/PersonalAccessToken'
import { TokenInterface } from 'types/v2/types'

import DockerIcon from '../../../public/docker-icon.svg'
import KubernetesIcon from '../../../public/kubernetes-icon.svg'
import PodmanIcon from '../../../public/podman-icon.svg'
import UserIcon from '../../../public/user-icon.svg'

type TokenCategory = 'personal access' | 'kubernetes' | 'rocket' | 'podman' | 'docker-log' | 'docker-config'

function isTokenCategory(tokenCategory: string | string[] | undefined): tokenCategory is TokenCategory {
  return (tokenCategory as TokenCategory) !== undefined
}

type TokenTabProps = {
  token: TokenInterface
}

export default function TokenTabs({ token }: TokenTabProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { tab } = router.query
  const [tokenCategory, setTokenCategory] = useState<TokenCategory>('personal access')
  // const [kubernetesToken, setKubernetesToken] = useState('')

  useEffect(() => {
    if (token) setOpen(true)
  }, [token])

  useEffect(() => {
    if (isTokenCategory(tab)) {
      setTokenCategory(tab ?? 'personal access')
    }
  }, [tab, setTokenCategory])

  const handleListItemClick = (category: TokenCategory) => {
    setTokenCategory(category)
    router.replace({
      query: { ...router.query, section: category },
    })
  }
  // function handleKubernetesTokenOnChange(value: string): void {
  //   setKubernetesToken(value)
  // }

  // const handleClose = () => {
  //   setIsLoading(true)
  //   router.push('/settings?tab=authentication&category=personal')
  // }

  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false)
      }}
      fullWidth
      maxWidth='md'
    >
      <DialogTitle>Token Created</DialogTitle>
      <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ sm: 2 }}
          divider={<Divider orientation='vertical' flexItem />}
        >
          <List sx={{ width: '225px', minWidth: 'max-content' }}>
            <ListItem disablePadding>
              <ListItemButton
                selected={tokenCategory === 'personal access'}
                onClick={() => handleListItemClick('personal access')}
              >
                <Stack sx={{ marginRight: 1 }}>
                  <Image src={UserIcon} alt='user-icon' width={19} height={19} />
                </Stack>
                Personal Access Token
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={tokenCategory === 'kubernetes'}
                onClick={() => handleListItemClick('kubernetes')}
              >
                <Stack sx={{ marginRight: 1 }}>
                  <Image src={KubernetesIcon} alt='kubernetes-icon' width={19} height={19} />
                </Stack>
                Kubernetes Secret
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={tokenCategory === 'rocket'} onClick={() => handleListItemClick('rocket')}>
                <Stack sx={{ marginRight: 1 }}>
                  {/* <Image src={RocketIcon} alt='rocket-icon' width={19} height={19} /> */}
                </Stack>
                Rocket Configuration
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={tokenCategory === 'podman'} onClick={() => handleListItemClick('podman')}>
                <Stack sx={{ marginRight: 1 }}>
                  <Image src={PodmanIcon} alt='podman-icon' width={19} height={19} />
                </Stack>
                Podman Login
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={tokenCategory === 'docker-log'}
                onClick={() => handleListItemClick('docker-log')}
              >
                <Stack sx={{ marginRight: 1 }}>
                  <Image src={DockerIcon} alt='docker icon' width={19} height={19} />
                </Stack>
                Docker Login
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={tokenCategory === 'docker-config'}
                onClick={() => handleListItemClick('docker-config')}
              >
                <Stack sx={{ marginRight: 1 }}>
                  <Image src={DockerIcon} alt='docker-icon' width={19} height={19} />
                </Stack>
                Docker Configuration
              </ListItemButton>
            </ListItem>
          </List>
          <Container sx={{ my: 2 }}>
            {tokenCategory === 'personal access' && <PersonalAccessToken token={token} />}
            {tokenCategory === 'kubernetes' && <KubernetesToken />}
            {/* {tokenCategory === 'rocket' && <RocketConfig />} */}
            {/* {tokenCategory === 'podman' && <PodmanLogin/>} */}
            {tokenCategory === 'docker-log' && <DockerLogin />}
            {/* {tokenCategory === 'docker-config' && <DockerConfig />} */}
          </Container>
        </Stack>
      </Box>
      {/* <DialogActions>
        <LoadingButton variant='contained' loading={isLoading} onClick={handleClose}>
          Continue
        </LoadingButton>
      </DialogActions> */}
    </Dialog>
  )
}
