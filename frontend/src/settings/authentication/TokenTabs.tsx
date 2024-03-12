import Person from '@mui/icons-material/Person'
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  Stack,
  Typography,
} from '@mui/material'
import Image from 'next/image'
import { useRouter } from 'next/router'
import DockerIcon from 'public/docker-icon.svg'
import KubernetesIcon from 'public/kubernetes-icon.svg'
import PodmanIcon from 'public/podman-logo.svg'
import RktLogo from 'public/rkt-logo.svg'
import { useEffect, useState } from 'react'
import DockerConfig from 'src/settings/authentication/DockerConfig'
import DockerLogin from 'src/settings/authentication/DockerLogin'
import KubernetesSecret from 'src/settings/authentication/KubernetesSecret'
import PersonalAccessToken from 'src/settings/authentication/PersonalAccessToken'
import PodmanLogin from 'src/settings/authentication/PodmanLogin'
import RocketConfig from 'src/settings/authentication/RocketConfig'
import TabButton from 'src/settings/authentication/TabButton'
import { TokenInterface } from 'types/types'

export const TokenCategory = {
  PERSONAL_ACCESS: 'personal access',
  KUBERNETES: 'kubernetes',
  ROCKET: 'rocket',
  PODMAN: 'podman',
  DOCKER_LOGIN: 'docker login',
  DOCKER_CONFIGURATION: 'docker configuration',
} as const

export type TokenCategoryKeys = (typeof TokenCategory)[keyof typeof TokenCategory]

function isTokenCategory(value: string | string[] | undefined): value is TokenCategoryKeys {
  return (
    value === TokenCategory.PERSONAL_ACCESS ||
    value === TokenCategory.KUBERNETES ||
    value === TokenCategory.ROCKET ||
    value === TokenCategory.PODMAN ||
    value === TokenCategory.DOCKER_LOGIN ||
    value === TokenCategory.DOCKER_CONFIGURATION
  )
}

type TokenTabProps = {
  token: TokenInterface
}

export default function TokenTabs({ token }: TokenTabProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { tab } = router.query
  const [tokenCategory, setTokenCategory] = useState<TokenCategoryKeys>(TokenCategory.PERSONAL_ACCESS)

  useEffect(() => {
    if (token) setOpen(true)
  }, [token])

  useEffect(() => {
    if (isTokenCategory(tab)) {
      setTokenCategory(tab ?? TokenCategory.PERSONAL_ACCESS)
    }
  }, [tab, setTokenCategory])

  const handleClose = () => {
    setOpen(false)
  }

  const handleListItemClick = (category: TokenCategoryKeys) => {
    setTokenCategory(category)
  }

  return (
    <Dialog
      fullWidth
      maxWidth='xl'
      open={open}
      onClose={() => {
        setOpen(false)
      }}
    >
      <DialogTitle>Token Created</DialogTitle>
      <DialogContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          divider={<Divider orientation='vertical' flexItem />}
        >
          <List sx={{ width: '325px' }}>
            <TabButton
              selected={tokenCategory === TokenCategory.PERSONAL_ACCESS}
              onClick={() => handleListItemClick(TokenCategory.PERSONAL_ACCESS)}
            >
              <Person fontSize='small' />
              <Typography ml={1}>Personal Access Token</Typography>
            </TabButton>
            <TabButton
              selected={tokenCategory === TokenCategory.KUBERNETES}
              onClick={() => handleListItemClick(TokenCategory.KUBERNETES)}
            >
              <Image src={KubernetesIcon} alt='kubernetes-icon' width={20} height={20} />
              <Typography ml={1}>Kubernetes Secret</Typography>
            </TabButton>
            <TabButton
              selected={tokenCategory === TokenCategory.ROCKET}
              onClick={() => handleListItemClick(TokenCategory.ROCKET)}
            >
              <Image src={RktLogo} alt='rocket-icon' width={20} height={20} />
              <Typography ml={1}>Rkt Configuration</Typography>
            </TabButton>
            <TabButton
              selected={tokenCategory === TokenCategory.PODMAN}
              onClick={() => handleListItemClick(TokenCategory.PODMAN)}
            >
              <Image src={PodmanIcon} alt='podman-icon' width={20} height={20} />
              <Typography ml={1}>Podman Login</Typography>
            </TabButton>
            <TabButton
              selected={tokenCategory === TokenCategory.DOCKER_LOGIN}
              onClick={() => handleListItemClick(TokenCategory.DOCKER_LOGIN)}
            >
              <Image src={DockerIcon} alt='docker icon' width={20} height={20} />
              <Typography ml={1}>Docker Login</Typography>
            </TabButton>
            <TabButton
              selected={tokenCategory === TokenCategory.DOCKER_CONFIGURATION}
              onClick={() => handleListItemClick(TokenCategory.DOCKER_CONFIGURATION)}
            >
              <Image src={DockerIcon} alt='docker-icon' width={20} height={20} />
              <Typography ml={1}>Docker Configuration</Typography>
            </TabButton>
          </List>
          <Container sx={{ my: 2 }}>
            {tokenCategory === TokenCategory.PERSONAL_ACCESS && <PersonalAccessToken token={token} />}
            {tokenCategory === TokenCategory.KUBERNETES && <KubernetesSecret token={token} />}
            {tokenCategory === TokenCategory.ROCKET && <RocketConfig token={token} />}
            {tokenCategory === TokenCategory.PODMAN && <PodmanLogin token={token} />}
            {tokenCategory === TokenCategory.DOCKER_LOGIN && <DockerLogin token={token} />}
            {tokenCategory === TokenCategory.DOCKER_CONFIGURATION && <DockerConfig token={token} />}
          </Container>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
