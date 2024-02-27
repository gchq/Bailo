import { LoadingButton } from '@mui/lab'
import { DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'
import CodeSnippetBox from 'src/settings/authentication/CodeSnippetBox'
import CopyInputTextField from 'src/settings/authentication/CopyInputTextField'

export default function KubernetesToken() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setIsLoading(true)
    router.push('/settings?tab=authentication&category=docker')
  }

  return (
    <DialogContent
      sx={{
        width: '600px',
        height: '400px',
        overflow: 'auto',
      }}
    >
      <Stack spacing={2} direction={{ xs: 'column' }}>
        <Typography fontWeight='bold'>Step 1: Download Secret</Typography>
        <Typography>First, download the Kubernetes pull secret for your personal access token.</Typography>
        <CopyInputTextField text={`Download <key-name>-auth.yml / View <key-name>-auth.yml `} />
        <Typography fontWeight='bold'>Step 2: Submit</Typography>
        <Typography>Second, submit the secret to the cluster usign this command:</Typography>
        <CopyInputTextField text={`kubectl create -f <key-name>-secret.yml --namespace=NAMESPACEHERE`} />
        <Typography fontWeight='bold'>Step 3: Update Kubernetes configuration</Typography>
        <Typography>
          Finally, add a reference to the secret to your Kubernetes pod config via an `imagePullSecrets` field, For
          example:
        </Typography>
        <CodeSnippetBox>
          {`apiVersion: v1
kind: Pod
metadata:
    name: somepod
    namespace: all
spec:
  containers:
    - name: web
      image: bailo.xxx.yyy.zzz/some-model-id/some-repo-id

  imagePullSecrets:
    - name: <key-name>-secret.yml
`}
        </CodeSnippetBox>
      </Stack>
      <DialogActions>
        <LoadingButton variant='contained' loading={isLoading} onClick={handleClose}>
          Continue
        </LoadingButton>
      </DialogActions>
    </DialogContent>
  )
}
