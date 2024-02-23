import { Box, Container, Dialog, DialogTitle, Divider, List, ListItem, ListItemButton, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'
import { useEffect, useState } from 'react'
import DockerToken from 'src/settings/authentication/DockerToken'
import KubernetesToken from 'src/settings/authentication/KubernetesToken'
import PersonalAccessToken from 'src/settings/authentication/PersonalAccessToken'
import { TokenInterface } from 'types/v2/types'

type TokenCategory = 'personal access' | 'docker' | 'kubernetes'

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
  const [kubernetesToken, setKubernetesToken] = useState('')

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
  function handleKubernetesTokenOnChange(value: string): void {
    setKubernetesToken(value)
  }

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
                Personal Access
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={tokenCategory === 'docker'} onClick={() => handleListItemClick('docker')}>
                Docker
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={tokenCategory === 'kubernetes'}
                onClick={() => handleListItemClick('kubernetes')}
              >
                Kubernetes
              </ListItemButton>
            </ListItem>
          </List>
          <Container sx={{ my: 2 }}>
            {tokenCategory === 'personal access' && <PersonalAccessToken token={token} />}
            {tokenCategory === 'docker' && <DockerToken />}
            {tokenCategory === 'kubernetes' && (
              <KubernetesToken onChange={handleKubernetesTokenOnChange} value={kubernetesToken} />
            )}
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
